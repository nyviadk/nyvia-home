import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import type { UvPoint, UvSnapshot } from './types';

/**
 * Hvor lang tid FØR UV rammer 3 skal advarslen komme? Vi bruger et rigtigt tids-varsel
 * frem for en fifle-tærskel (tidligere 2,75), så beskeden er ærlig: "om 30 min rammer UV 3".
 * Slut-beskeden kommer derimod præcis når UV falder under 3 — den skal ikke komme før.
 */
export const UV_ALERT_LEAD_MIN = 30;

/**
 * Hudtype 1 (meget sart) — kalibreret på brugerens egen erfaring: ca. 20 min ubeskyttet
 * ved UV 3. Forbrændingstid er omvendt proportional med UV-indekset:
 *   t = 20 min × 3 / uv = 60 / uv
 * Fx: UV 3 → 20 min, UV 6 → 10 min, UV 1,5 → 40 min.
 */
export function minutesToBurn(uv: number): number | null {
  if (uv <= 0) return null;
  return Math.round(60 / uv);
}

/** UV under 3 → beskyttelse er ikke nødvendig (WHO — og din egen erfaring: du brænder over 3). */
export const UV_RISK_THRESHOLD = 3;

/**
 * Rådgivning for hudtype 1. UNDER UV 3 vises INGEN nedtælling: der er ingen reel
 * forbrændingsrisiko, og fx "80 min ubeskyttet" ved UV 0,8 ville modsige rådet om, at
 * solcreme først er nødvendig fra 3.
 */
export function burnAdvice(uv: number): string {
  if (uv < UV_RISK_THRESHOLD) return 'Ingen beskyttelse nødvendig (UV under 3)';
  return `Sart hud: ca. ${minutesToBurn(uv)} min ubeskyttet`;
}

export interface UvLevel {
  label: string;
  color: string;
}

/** WHO-skalaen, i dæmpede farver der passer til appens varme tema. */
export function uvLevel(uv: number): UvLevel {
  if (uv < 3) return { label: 'Lav', color: '#4e8d5b' };
  if (uv < 6) return { label: 'Moderat', color: '#b8912c' };
  if (uv < 8) return { label: 'Høj', color: '#c2752f' };
  if (uv < 11) return { label: 'Meget høj', color: '#c0453c' };
  return { label: 'Ekstrem', color: '#8156a8' };
}

export function formatHour(unixSeconds: number): string {
  return DateTime.fromSeconds(unixSeconds).setZone(APP_TIMEZONE).toFormat('HH:mm');
}

/** "I dag" / "I morgen" / "ons. 15. jul." — så to ens klokkeslæt ikke ligner en dublet. */
export function dayLabel(unixSeconds: number): string {
  const dt = DateTime.fromSeconds(unixSeconds).setZone(APP_TIMEZONE);
  const days = dt.startOf('day').diff(DateTime.now().setZone(APP_TIMEZONE).startOf('day'), 'days')
    .days;
  if (days === 0) return 'I dag';
  if (days === 1) return 'I morgen';
  return dt.setLocale('da').toFormat('ccc d. MMM');
}

export function formatClockFromISO(iso: string): string {
  return DateTime.fromISO(iso).setZone(APP_TIMEZONE).toFormat('HH:mm');
}

/** "Odder, Region Midtjylland, Danmark" → "Odder". */
export function shortPlaceName(name: string): string {
  return name.split(',')[0]?.trim() || name;
}

/**
 * Interpolér tidspunktet hvor UV krydser tærsklen mellem to målepunkter (15 min fra hinanden).
 *
 * Præcision: 15 min er Open-Meteos FINESTE opløsning (verificeret — minutely_5/_1 findes ikke).
 * Selve krydsningen regnes til minuttet, men værdierne er afrundet til 0,05, og med en typisk
 * hældning på ~0,25/kvarter giver det en reel usikkerhed på ±1-2 minutter. Finere interpolation
 * ville derfor kun være falsk præcision.
 */
export function crossingTime(a: UvPoint, b: UvPoint, threshold: number): number {
  const span = b.uv - a.uv;
  if (span === 0) return b.t;
  const ratio = (threshold - a.uv) / span;
  return Math.round(a.t + ratio * (b.t - a.t));
}

export interface UvWindow {
  /** Unix-sekund hvor UV krydser OP over tærsklen. */
  start: number;
  /** Unix-sekund hvor UV falder UNDER tærsklen igen. */
  end: number;
}

/**
 * Find perioder hvor UV ligger over tærsklen — altså "start- og sluttid" for farlig sol.
 * Tidspunkterne interpoleres mellem timerne, så de bliver mere præcise end hele timer.
 */
export function uvWindows(points: UvPoint[], threshold = UV_RISK_THRESHOLD): UvWindow[] {
  const out: UvWindow[] = [];
  if (points.length === 0) return out;

  // Er vi allerede over tærsklen i første punkt, er vinduet i gang.
  let start: number | null = points[0].uv >= threshold ? points[0].t : null;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    if (prev.uv < threshold && cur.uv >= threshold) {
      start = crossingTime(prev, cur, threshold);
    } else if (prev.uv >= threshold && cur.uv < threshold && start !== null) {
      out.push({ start, end: crossingTime(prev, cur, threshold) });
      start = null;
    }
  }
  // Stadig over tærsklen ved prognosens slutning → luk ved sidste punkt.
  if (start !== null) out.push({ start, end: points[points.length - 1].t });
  return out;
}

/**
 * Slå flere steders data sammen til ÉT worst-case-overblik: højeste UV pr. tidspunkt.
 * Steder tæt på hinanden følges nærmest ad, så fire næsten ens blokke er ren støj — og for
 * solforbrænding er det højeste tal desuden det sikre at planlægge efter.
 */
export function aggregateSnapshots(snaps: UvSnapshot[]): UvSnapshot | null {
  if (snaps.length === 0) return null;
  if (snaps.length === 1) return snaps[0];

  const pointMax = new Map<number, number>();
  const dayMax = new Map<number, number>();
  let current = 0;
  let currentT = snaps[0].currentT;
  let intervalSec = snaps[0].intervalSec;
  let fetchedAt = snaps[0].fetchedAt;

  for (const s of snaps) {
    if (s.current > current) current = s.current;
    for (const p of s.series ?? []) pointMax.set(p.t, Math.max(pointMax.get(p.t) ?? 0, p.uv));
    for (const d of s.daily) dayMax.set(d.t, Math.max(dayMax.get(d.t) ?? 0, d.max));
    // Vurder friskhed konservativt = det ældste svar.
    if (s.currentT < currentT) {
      currentT = s.currentT;
      intervalSec = s.intervalSec;
    }
    if (s.fetchedAt < fetchedAt) fetchedAt = s.fetchedAt;
  }

  return {
    placeId: '__alle__',
    current,
    currentT,
    intervalSec,
    series: [...pointMax.entries()].sort((a, b) => a[0] - b[0]).map(([t, uv]) => ({ t, uv })),
    daily: [...dayMax.entries()].sort((a, b) => a[0] - b[0]).map(([t, max]) => ({ t, max })),
    fetchedAt,
    lat: snaps[0].lat,
    lon: snaps[0].lon,
  };
}

export interface UvDaySummary {
  t: number;
  max: number;
  /** Perioden hvor UV er over 3 den dag (null hvis dagen aldrig når 3). */
  window: UvWindow | null;
  isToday: boolean;
  /** Dagens vindue er allerede overstået. */
  isPast: boolean;
  /** Vi er INDE i vinduet lige nu. */
  isNow: boolean;
}

/**
 * Én linje pr. dag: maks-UV + hvornår UV er over 3 — og om det er i dag, overstået eller i gang.
 * Bruger RISIKO-tærsklen (3), ikke varsels-tærsklen (2,75), så teksten matcher "over 3".
 */
export function daySummaries(snapshot: UvSnapshot): UvDaySummary[] {
  const now = Math.floor(Date.now() / 1000);
  const windows = uvWindows(snapshot.series ?? [], UV_RISK_THRESHOLD);

  return snapshot.daily.map((d) => {
    const dayEnd = d.t + 86_400;
    const window = windows.find((w) => w.start >= d.t && w.start < dayEnd) ?? null;
    return {
      t: d.t,
      max: d.max,
      window,
      isToday: now >= d.t && now < dayEnd,
      isPast: window !== null && window.end <= now,
      isNow: window !== null && window.start <= now && now < window.end,
    };
  });
}

/**
 * Punkterne til strippen: resten af i dag hvis der er sol tilbage, ellers ruller den
 * automatisk videre til næste dag med sol (så strippen aldrig står med 1-2 sølle punkter).
 *
 * Vises i KVARTERS-skridt (Open-Meteos fulde 15-min opløsning), så man kan aflæse præcis
 * hvornår UV passerer 3 — samme datapunkter som krydsningstidspunkterne regnes ud fra.
 */
export function upcomingSunPoints(snapshot: UvSnapshot): { label: string; points: UvPoint[] } {
  const now = Math.floor(Date.now() / 1000);
  const series = snapshot.series ?? [];

  for (const d of snapshot.daily) {
    const dayEnd = d.t + 86_400;
    if (dayEnd <= now) continue;
    const from = Math.max(d.t, now - 900); // tag det igangværende kvarter med
    const points = series.filter((p) => p.t >= from && p.t < dayEnd && p.uv > 0);
    // Under ~3 timers sol tilbage (12 kvarter) → dagen er reelt ovre; vis næste dag i stedet.
    if (points.length >= 12) {
      const label = dayLabel(d.t);
      return { label: label === 'I dag' ? 'Resten af i dag' : label, points };
    }
  }
  return { label: '', points: [] };
}
