import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';

/** Tidsfilter for oversigten. */
export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

/** Parse "HH:mm" → minutter siden midnat, eller null hvis ugyldig. */
export function parseHm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number.parseInt(m[1], 10);
  const min = Number.parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Varighed i minutter mellem start og slut. Hvis slut <= start tolkes det som
 * natarbejde (slutter næste dag), så fx 22:00→01:30 = 210 min.
 */
export function durationFromTimes(startTime: string, endTime: string): number {
  const start = parseHm(startTime);
  const end = parseHm(endTime);
  if (start === null || end === null) return 0;
  const adjustedEnd = end <= start ? end + 24 * 60 : end;
  return adjustedEnd - start;
}

/** True hvis posten krydser midnat (slutter næste dag). */
export function isOvernight(startTime: string, endTime: string): boolean {
  const start = parseHm(startTime);
  const end = parseHm(endTime);
  return start !== null && end !== null && end <= start;
}

/** Nuværende tidspunkt som HH:mm (Copenhagen). */
export function nowHm(): string {
  return DateTime.now().setZone(APP_TIMEZONE).toFormat('HH:mm');
}

/**
 * Maskér tastet input til HH:mm uden at brugeren selv skriver ":". De første to cifre
 * er timer, resten minutter (fx "0930" → "09:30", "09" → "09").
 */
export function maskTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

const hh = (h: number) => String(h).padStart(2, '0');

/**
 * Søge-agtige tids-forslag ud fra det taster: tomt → ingen; 1–2 cifre → timen på
 * kvarter; 3 cifre → de to matchende minutter; 4 → eksakt.
 */
export function timeSuggestions(value: string): string[] {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length === 0) return [];
  if (digits.length === 1) {
    const h = Number.parseInt(digits, 10);
    return [`0${h}:00`, `0${h}:15`, `0${h}:30`, `0${h}:45`];
  }
  if (digits.length === 2) {
    const h = Number.parseInt(digits, 10);
    if (h > 23) return [];
    return [`${hh(h)}:00`, `${hh(h)}:15`, `${hh(h)}:30`, `${hh(h)}:45`];
  }
  if (digits.length === 3) {
    const h = Number.parseInt(digits.slice(0, 2), 10);
    const m1 = Number.parseInt(digits.slice(2, 3), 10);
    if (h > 23 || m1 > 5) return [];
    return [`${hh(h)}:${m1}0`, `${hh(h)}:${m1}5`];
  }
  const h = Number.parseInt(digits.slice(0, 2), 10);
  const m = Number.parseInt(digits.slice(2, 4), 10);
  if (h > 23 || m > 59) return [];
  return [`${hh(h)}:${hh(m)}`];
}

/** Læg minutter til et HH:mm (wrapper rundt om midnat), eller null hvis ugyldigt. */
export function addMinutesToHm(hm: string, minutes: number): string | null {
  const base = parseHm(hm);
  if (base === null) return null;
  const t = (((base + minutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** Minutter → "2t 30m" / "45m" / "0m". */
export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}t`;
  return `${sign}${h}t ${m}m`;
}

/** Nedre grænse (ÅÅÅÅ-MM-DD, inkl.) for et tidsfilter, eller null for "alt". */
export function rangeStartDate(range: TimeRange): string | null {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  switch (range) {
    case 'today':
      return now.toFormat('yyyy-MM-dd');
    case 'week':
      return now.startOf('week').toFormat('yyyy-MM-dd');
    case 'month':
      return now.startOf('month').toFormat('yyyy-MM-dd');
    case 'year':
      return now.startOf('year').toFormat('yyyy-MM-dd');
    case 'all':
      return null;
  }
}
