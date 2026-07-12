import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import { notify } from '@/lib/toast/notify';
import { cancelUvAlerts, ensureNotificationPermission, scheduleUvAlerts } from '../notifications';
import type { UvPlace, UvSnapshot } from '../types';
import { formatHour, shortPlaceName } from '../uv.utils';
import { fetchUvForecast } from './open-meteo';
import { saveUvSettings, subscribeUvSettings } from './uv-settings.repository';
import { canSpend, EMPTY_USAGE, spend, type Usage } from './usage';

/**
 * Sikkerheds-gulv: hent aldrig oftere end hvert 2. minut — også hvis Open-Meteo skulle være
 * lidt forsinket med at publicere næste slot (så vi ikke hamrer løs på dem).
 */
const MIN_INTERVAL_MS = 2 * 60_000;
/** Hvor mange steder man kan gemme. */
export const MAX_PLACES = 5;

interface UvState {
  /** Gemt på KONTOEN (Firestore) → deles mellem web og telefon. Persisteres kun som cache. */
  places: UvPlace[];
  /** Ét snapshot PR. sted — alle steder vises samtidig. Ren lokal cache (vejrdata deles ikke). */
  snapshots: Record<string, UvSnapshot>;
  loading: boolean;
  error: string | null;
  /** Forbrug mod Open-Meteos grænser (minut/time/dag/måned). */
  /** Lokalt: forbrug tælles pr. enhed (Open-Meteo sender ingen kvote-headers). */
  usage: Usage;
  /** Lokalt: notifikations-tilladelse er per enhed. */
  notifyEnabled: boolean;
  /** Gemt på kontoen: hvilket sted varslerne gælder (telefonen ved ikke hvor du er). */
  notifyPlaceId: string | null;
  /** Lokalt: id'er på planlagte varsler i Androids scheduler. */
  scheduledIds: string[];
}

export const useUvStore = create<UvState>()(
  persist(
    () => ({
      places: [] as UvPlace[],
      snapshots: {} as Record<string, UvSnapshot>,
      loading: false,
      error: null,
      usage: EMPTY_USAGE,
      notifyEnabled: false,
      notifyPlaceId: null,
      scheduledIds: [] as string[],
    }),
    persistOptions<UvState>('uv', [
      'places',
      'snapshots',
      'usage',
      'notifyEnabled',
      'notifyPlaceId',
      'scheduledIds',
    ]),
  ),
);

/**
 * Findes der overhovedet NYE data at hente?
 *
 * Svaret fortæller selv hvilket slot det stammer fra (`currentT`) og hvor langt slottet er
 * (`intervalSec`, typisk 900s). Ny data findes derfor først ved `currentT + intervalSec`.
 * Vi låser altså op på OPEN-METEOS ur — ikke vores eget. Et fast "15 min siden vi sidst
 * hentede" ville være FORSKUDT i forhold til deres opdateringer og kunne blokere for data
 * der lige var udkommet (præcis den fejl du fangede).
 */
function isStale(snap: UvSnapshot): boolean {
  // Gammelt cachet svar uden 15-min serie (fra før omlægningen) → hent forfra.
  if (!snap.series || snap.series.length === 0) return true;

  const nowSec = Math.floor(Date.now() / 1000);
  // Deres nuværende slot er stadig det nyeste → intet nyt at hente.
  if (nowSec < snap.currentT + snap.intervalSec) return false;
  return Date.now() - new Date(snap.fetchedAt).getTime() >= MIN_INTERVAL_MS;
}

function countCalls(n: number): void {
  if (n <= 0) return;
  useUvStore.setState({ usage: spend(useUvStore.getState().usage, n) });
}

/** Planlæg varsler ud fra det sted varslerne gælder (kun hvis slået til; fejler stille). */
async function syncAlerts(): Promise<void> {
  const s = useUvStore.getState();
  if (!s.notifyEnabled) return;
  const snapshot = s.notifyPlaceId ? s.snapshots[s.notifyPlaceId] : undefined;
  if (!snapshot) return;
  try {
    const ids = await scheduleUvAlerts(snapshot, s.scheduledIds);
    useUvStore.setState({ scheduledIds: ids });
  } catch {
    // Varsler er "nice to have" — må aldrig vælte UV-visningen.
  }
}

/** Hvornår udgiver Open-Meteo næste måling (tidligste slot på tværs af steder)? */
function nextDataAt(places: UvPlace[], snapshots: Record<string, UvSnapshot>): number | null {
  const times = places
    .map((p) => snapshots[p.id])
    .filter((s): s is UvSnapshot => Boolean(s))
    .map((s) => s.currentT + (s.intervalSec || 900));
  return times.length > 0 ? Math.min(...times) : null;
}

/** Hent de givne steder og flet resultatet ind (de øvrige steders data bevares). */
async function fetchInto(places: UvPlace[]): Promise<{ ok: number; failed: number }> {
  const results = await Promise.allSettled(places.map((p) => fetchUvForecast(p)));

  const snapshots = { ...useUvStore.getState().snapshots };
  let ok = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      snapshots[r.value.placeId] = r.value;
      ok += 1;
    }
  }
  countCalls(ok);

  const failed = results.length - ok;
  useUvStore.setState({
    snapshots,
    loading: false,
    // Fallback: de steder der fejlede beholder deres tidligere (cachede) snapshot.
    error: failed > 0 ? `Kunne ikke opdatere ${failed} sted(er) — viser gemte data.` : null,
  });

  void syncAlerts();
  return { ok, failed };
}

/**
 * Henter friske UV-data for ALLE gemte steder (kun dem der er forældede, medmindre `force`).
 * Holder selv rate-limit via friskheds-vindue + dags-loft; fallback = sidste cachede svar.
 */
export async function refreshUv(manual = false): Promise<void> {
  const s = useUvStore.getState();
  if (s.loading || s.places.length === 0) return;

  const stale = s.places.filter((p) => {
    const snap = s.snapshots[p.id];
    return !snap || isStale(snap);
  });
  const fromCache = s.places.length - stale.length;

  // Intet nyt slot hos Open-Meteo endnu → kaldet ville give identisk svar. Spar det.
  if (stale.length === 0) {
    if (manual) {
      const next = nextDataAt(s.places, s.snapshots);
      notify(
        next
          ? `Ingen nye tal endnu — næste kl. ${formatHour(next)} (viser cache)`
          : 'Tallene er allerede friske (viser cache)',
      );
    }
    return;
  }

  // Rate-guard mod Open-Meteos FAKTISKE grænser (minut/time/dag/måned).
  if (!canSpend(s.usage, stale.length)) {
    useUvStore.setState({ error: 'Open-Meteos grænse nået — viser gemte data.' });
    notify('API-grænse nået — viser cache');
    return;
  }

  useUvStore.setState({ loading: true, error: null });
  const { ok, failed } = await fetchInto(stale);

  if (ok === 0) {
    notify('Kunne ikke hente UV — viser cache');
  } else if (failed > 0) {
    notify(`${ok} opdateret · ${failed} fejlede (viser cache)`);
  } else {
    const suffix = fromCache > 0 ? ` · ${fromCache} fra cache` : '';
    notify(`Friske tal hentet (${ok} ${ok === 1 ? 'sted' : 'steder'})${suffix}`);
  }
}

/**
 * Skriv steder til KONTOEN (Firestore). Optimistisk: local state er allerede opdateret, så
 * UI'et er øjeblikkeligt — Firestore-køen håndterer offline, og listeneren nedenfor bekræfter.
 */
function persistPlaces(places: UvPlace[], notifyPlaceId: string | null): void {
  void saveUvSettings(places, notifyPlaceId).catch(() => {
    notify('Kunne ikke gemme steder på kontoen');
  });
}

/** Tilføj et sted (maks MAX_PLACES) og hent UV for det med det samme. */
export async function addPlace(place: UvPlace): Promise<void> {
  const s = useUvStore.getState();
  const exists = s.places.some((p) => p.id === place.id);

  if (!exists && s.places.length >= MAX_PLACES) {
    useUvStore.setState({ error: `Du kan højst gemme ${MAX_PLACES} steder — fjern ét først.` });
    return;
  }

  const places = exists
    ? s.places.map((p) => (p.id === place.id ? place : p))
    : [...s.places, place];
  const notifyPlaceId = s.notifyPlaceId ?? place.id;

  useUvStore.setState({ places, notifyPlaceId, loading: true, error: null });
  persistPlaces(places, notifyPlaceId);

  const { failed } = await fetchInto([place]);
  notify(
    failed > 0
      ? `Kunne ikke hente UV for ${shortPlaceName(place.name)}`
      : `${shortPlaceName(place.name)} tilføjet — UV hentet`,
  );
}

export async function removePlace(id: string): Promise<void> {
  const s = useUvStore.getState();
  const places = s.places.filter((p) => p.id !== id);
  const snapshots = { ...s.snapshots };
  delete snapshots[id];

  const notifyPlaceId = s.notifyPlaceId === id ? (places[0]?.id ?? null) : s.notifyPlaceId;
  useUvStore.setState({ places, snapshots, notifyPlaceId, error: null });
  persistPlaces(places, notifyPlaceId);

  if (s.notifyPlaceId === id) await syncAlerts();
}

/** Vælg hvilket sted varslerne gælder. */
export async function setNotifyPlace(id: string): Promise<void> {
  const s = useUvStore.getState();
  useUvStore.setState({ notifyPlaceId: id });
  persistPlaces(s.places, id);
  await syncAlerts();
}

/** Slå lokale UV-varsler til/fra (kun native — beder om tilladelse første gang). */
export async function setUvNotifyEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    const { scheduledIds } = useUvStore.getState();
    await cancelUvAlerts(scheduledIds);
    useUvStore.setState({ notifyEnabled: false, scheduledIds: [] });
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    useUvStore.setState({
      notifyEnabled: false,
      error: 'Varsler kræver tilladelse til notifikationer.',
    });
    return;
  }

  useUvStore.setState({ notifyEnabled: true, error: null });
  await syncAlerts();
}

// ── Steder synkes fra kontoen (Firestore) ────────────────────────────────────────────────
// Én listener mens brugeren er logget ind. Tilføjer/fjerner du et sted på web, slår det
// igennem på telefonen og omvendt. De persisterede `places` er kun en cache til kold start.

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeUvSettings((doc) => {
    const places = doc?.places ?? [];
    const notifyPlaceId = doc?.notifyPlaceId ?? null;

    // Ryd cachede snapshots for steder der ikke findes længere (fx slettet på en anden enhed).
    const ids = new Set(places.map((p) => p.id));
    const snapshots = Object.fromEntries(
      Object.entries(useUvStore.getState().snapshots).filter(([id]) => ids.has(id)),
    );

    useUvStore.setState({ places, notifyPlaceId, snapshots });
    // Hent UV for evt. nye steder (refreshUv henter kun dem der mangler/er forældede).
    void refreshUv();
  });
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useUvStore.setState({ places: [], notifyPlaceId: null, snapshots: {} });
}

hotReloadSubscribe('nyvia.uv-settings', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => (user ? start() : stop()));
  return () => {
    unsubAuth();
    stop();
  };
});
