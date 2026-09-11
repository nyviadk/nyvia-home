import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';

/** Trinnene i tidsfilteret. Hvad hvert trin DÆKKER, afgøres af `TimeMode`. */
export type TimeRange = 'today' | '7d' | '31d' | '365d' | 'all';

/**
 * Rullende eller fast periode.
 *
 * `rullende` = de seneste N døgn inkl. i dag. `fast` = kalenderens egen uge/måned/år.
 * Forskellen er ikke kosmetisk: mandag morgen viser "seneste 7 dage" en hel forrige uges
 * arbejde, mens "denne uge" viser nul. Begge tal er rigtige, men de svarer på hvert sit
 * spørgsmål, og man skal kunne se hvilket man kigger på.
 */
export type TimeMode = 'rullende' | 'fast';

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

/**
 * Nedre grænse (ÅÅÅÅ-MM-DD, inkl.) for et tidsfilter, eller null for "alt".
 *
 * Ingen ØVRE grænse i nogen af udgaverne — poster fremad i tiden er med. Det er bevidst:
 * en registrering med en fremtidig dato er som regel en tastefejl, og den skal kunne ses
 * og rettes, ikke gemmes væk.
 */
export function rangeStartDate(range: TimeRange, mode: TimeMode): string | null {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const fmt = (d: DateTime) => d.toFormat('yyyy-MM-dd');
  switch (range) {
    case 'today':
      return fmt(now);
    // Luxons `startOf('week')` er ISO-uge = mandag, som i Danmark. Søndag er med, fordi
    // der ikke er nogen øvre grænse.
    case '7d':
      return fmt(mode === 'fast' ? now.startOf('week') : now.minus({ days: 6 }));
    case '31d':
      return fmt(mode === 'fast' ? now.startOf('month') : now.minus({ days: 30 }));
    case '365d':
      return fmt(mode === 'fast' ? now.startOf('year') : now.minus({ days: 364 }));
    case 'all':
      return null;
  }
}

/** Etiketterne på trinnene. Skifter med udgaven, så knappen siger hvad den gør. */
export function rangeOptions(mode: TimeMode): { value: TimeRange; label: string }[] {
  const fast = mode === 'fast';
  return [
    { value: 'today', label: 'I dag' },
    { value: '7d', label: fast ? 'Uge' : '7 dage' },
    { value: '31d', label: fast ? 'Måned' : '31 dage' },
    { value: '365d', label: fast ? 'År' : '365 dage' },
    { value: 'all', label: 'Alt' },
  ];
}

/**
 * Hvilken periode tallene dækker, i klar tekst.
 *
 * Findes fordi de to udgaver har trin der ligner hinanden. Uden en linje der siger hvad
 * der er valgt, kan man ikke se på totalen om den dækker mandag-til-nu eller de sidste syv
 * døgn — og de to tal ligner hinanden nok til at man ikke opdager forskellen.
 */
export function rangeLabel(range: TimeRange, mode: TimeMode): string {
  const now = DateTime.now().setZone(APP_TIMEZONE).setLocale('da');
  const stort = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  if (mode === 'rullende') {
    switch (range) {
      case 'today':
        return `i dag, ${now.toFormat('d. MMM')}`;
      case '7d':
        return 'seneste 7 dage';
      case '31d':
        return 'seneste 31 dage';
      case '365d':
        return 'seneste 365 dage';
      case 'all':
        return 'alle registreringer';
    }
  }
  switch (range) {
    case 'today':
      return `i dag, ${now.toFormat('d. MMM')}`;
    case '7d': {
      const man = now.startOf('week');
      const soen = man.plus({ days: 6 });
      const sammeMaaned = man.month === soen.month;
      return `uge ${now.weekNumber} · ${man.toFormat(sammeMaaned ? 'd.' : 'd. MMM')}–${soen.toFormat('d. MMM')}`;
    }
    case '31d':
      return stort(now.toFormat('LLLL yyyy'));
    case '365d':
      return now.toFormat('yyyy');
    case 'all':
      return 'alle registreringer';
  }
}
