import { useEffect, useRef, useState } from 'react';

import { auth, type CollectionSnapshot, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';

/**
 * Abonnementer på Firestore fra en KOMPONENT.
 *
 * `createCollectionStore` dækker de globale, auth-bundne kollektioner (én store pr. kollektion,
 * startet af login). Den kan ikke bruges når stien afhænger af noget fra ruten — fx den delte
 * ønskeliste, hvor ejerens uid står i URL'en og gæsten slet ikke er logget ind. Uden disse hooks
 * ender hver sådan liste med sit eget `useState` + `useEffect` + `onSnapshot`, og det mønster blev
 * gentaget ni gange i ønskelisten.
 *
 * `key` skal FULDT bestemme `subscribe` (typisk Firestore-stien): abonnementet genstartes kun når
 * key ændrer sig, og den nyeste `subscribe` bruges via en ref — så en ny funktions-identitet ved
 * hver render ikke river forbindelsen ned.
 *
 * VIGTIGT: `key` er også nøgle i den GLOBALE cache nedenfor og skal derfor være unik for de data
 * den henter — ikke bare for stien. To forskellige kollektioner med samme key overskriver hinandens
 * cache, og næste montering starter så op med den anden kollektions dokumenter (typed som T, uden
 * at TypeScript kan fange det). Præfiks derfor altid med hvad der hentes, fx `wishes:${uid}`.
 */

type Subscribe<S> = (onChange: (snap: S) => void, onError?: (e: Error) => void) => Unsubscribe;

type LiveState<T> = { items: WithId<T>[]; loading: boolean; failed: boolean };

/**
 * Sidste kendte resultat pr. key, så en skærm man vender TILBAGE til maler med det samme frem for
 * at blinke tomt imens listeneren kobler op igen. De auth-bundne stores får det samme via zustands
 * persist; disse komponent-abonnementer havde ingen tilsvarende hukommelse.
 */
const snapshotCache = new Map<string, unknown[]>();
const docCache = new Map<string, unknown>();

/**
 * Ryd cachen ved logout. Uden dette overlever de hentede dokumenter i JS-konteksten, og
 * logger en ANDEN bruger ind i samme session, ville skærmen nå at male forrige brugers data
 * inden den nye listener svarer. De auth-bundne stores nulstiller allerede sig selv
 * (`createCollectionStore.stop`); disse to maps havde ingen tilsvarende oprydning.
 */
hotReloadSubscribe('nyvia.live-query-cache', () =>
  auth.onAuthStateChanged((user) => {
    if (!user) {
      snapshotCache.clear();
      docCache.clear();
    }
  })
);

export function useLiveCollection<T>(
  key: string | null,
  subscribe: Subscribe<CollectionSnapshot<T>>,
): LiveState<T> {
  const fromCache = (k: string | null): LiveState<T> => {
    const cached = k ? (snapshotCache.get(k) as WithId<T>[] | undefined) : undefined;
    return { items: cached ?? [], loading: !!k && !cached, failed: false };
  };

  const [state, setState] = useState<LiveState<T>>(() => fromCache(key));
  const [seenKey, setSeenKey] = useState(key);
  const latest = useRef(subscribe);
  latest.current = subscribe;

  /**
   * Nøglen kan skifte i en levende komponent — typisk fra `null` til en rigtig sti, når et
   * abonnement først må starte (den delte ønskeliste venter på at vide hvem der kigger).
   * Nulstillingen sker UNDER render, ikke i en effect: en effect maler først det forrige
   * resultat, og cachen ville slet ikke blive brugt, fordi `useState`-initialiseringen kun
   * kører ved montering. Så ville hvert nøgleskift give præcis det tomme blink cachen findes
   * for at undgå.
   */
  if (key !== seenKey) {
    setSeenKey(key);
    setState(fromCache(key));
  }

  useEffect(() => {
    if (!key) return;
    return latest.current(
      (snap) => {
        snapshotCache.set(key, snap.docs);
        setState({ items: snap.docs, loading: false, failed: false });
      },
      () => setState((s) => ({ ...s, loading: false, failed: s.items.length === 0 })),
    );
  }, [key]);

  return state;
}

/** Samme, for et enkelt dokument. `data` er null indtil det er hentet (eller hvis det ikke findes). */
export function useLiveDoc<T>(
  key: string | null,
  subscribe: Subscribe<T | null>,
): { data: T | null; loading: boolean } {
  const fromCache = (k: string | null) => {
    const cached = k ? (docCache.get(k) as T | undefined) : undefined;
    return { data: cached ?? null, loading: !!k && cached === undefined };
  };

  const [state, setState] = useState<{ data: T | null; loading: boolean }>(() => fromCache(key));
  const [seenKey, setSeenKey] = useState(key);
  const latest = useRef(subscribe);
  latest.current = subscribe;

  // Samme nøgleskift-håndtering som ovenfor.
  if (key !== seenKey) {
    setSeenKey(key);
    setState(fromCache(key));
  }

  useEffect(() => {
    if (!key) return;
    return latest.current(
      (data) => {
        docCache.set(key, data);
        setState({ data, loading: false });
      },
      () => setState((s) => ({ ...s, loading: false })),
    );
  }, [key]);

  return state;
}
