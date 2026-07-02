import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';

/**
 * Danske bankhelligdage/lukkedage — beregnet lokalt (INGEN API).
 * Banken kan ikke gennemføre overførsler på disse dage (+ weekender).
 */

/** Påskedag (søndag) via Meeus/Jones/Butcher-algoritmen (gregoriansk). */
function easterSunday(year: number): DateTime {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marts, 4 = april
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return DateTime.fromObject({ year, month, day }, { zone: APP_TIMEZONE });
}

const cache = new Map<number, Set<string>>();

/** Sæt af bank-lukkede datoer (ÅÅÅÅ-MM-DD) for et år — helligdage + bank-lukkedage. */
function bankClosedDates(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const fixed = (month: number, day: number) =>
    DateTime.fromObject({ year, month, day }, { zone: APP_TIMEZONE });

  const days: DateTime[] = [
    fixed(1, 1), // Nytårsdag
    easter.minus({ days: 3 }), // Skærtorsdag
    easter.minus({ days: 2 }), // Langfredag
    easter, // Påskedag
    easter.plus({ days: 1 }), // 2. påskedag
    easter.plus({ days: 39 }), // Kristi himmelfartsdag
    easter.plus({ days: 49 }), // Pinsedag
    easter.plus({ days: 50 }), // 2. pinsedag
    fixed(6, 5), // Grundlovsdag (banker lukket)
    fixed(12, 24), // Juleaftensdag (banker lukket)
    fixed(12, 25), // Juledag
    fixed(12, 26), // 2. juledag
    fixed(12, 31), // Nytårsaftensdag (banker lukket)
    // Store Bededag er afskaffet fra 2024 → medregnes ikke.
  ];

  const set = new Set(days.map((d) => d.toFormat('yyyy-MM-dd')));
  cache.set(year, set);
  return set;
}

/** True hvis banken er lukket (weekend eller dansk helligdag/lukkedag). */
export function isBankClosed(date: DateTime): boolean {
  const weekday = date.weekday; // 6 = lørdag, 7 = søndag
  if (weekday === 6 || weekday === 7) return true;
  return bankClosedDates(date.year).has(date.toFormat('yyyy-MM-dd'));
}

// Cache pr. (år, måned): rene funktioner, og de samme måneder slås op mange gange under et
// forecast. Undgår while-løkken + de dyre zoned luxon-allokeringer ved gentagne kald.
const lastBankCache = new Map<number, DateTime>();
const firstBankCache = new Map<number, DateTime>();

/** Sidste bankdag i måneden (sidste dag, der ikke er lukket). Cachet pr. (år, måned). */
export function lastBankDayOfMonth(year: number, month: number): DateTime {
  const key = year * 100 + month;
  const cached = lastBankCache.get(key);
  if (cached) return cached;
  let d = DateTime.fromObject({ year, month }, { zone: APP_TIMEZONE }).endOf('month').startOf('day');
  while (isBankClosed(d)) d = d.minus({ days: 1 });
  lastBankCache.set(key, d);
  return d;
}

/** Første bankdag i måneden (første dag, der ikke er lukket). Cachet pr. (år, måned). */
export function firstBankDayOfMonth(year: number, month: number): DateTime {
  const key = year * 100 + month;
  const cached = firstBankCache.get(key);
  if (cached) return cached;
  let d = DateTime.fromObject({ year, month, day: 1 }, { zone: APP_TIMEZONE }).startOf('day');
  while (isBankClosed(d)) d = d.plus({ days: 1 });
  firstBankCache.set(key, d);
  return d;
}

/** Ryk en dato bagud til foregående bankdag (overførsler kan ikke ske på lukkedage). */
export function previousBankDay(date: DateTime): DateTime {
  let d = date;
  while (isBankClosed(d)) d = d.minus({ days: 1 });
  return d;
}

/** Ryk en dato FREM til næste bankdag (en betaling på en lukkedag gennemføres den
 *  førstkommende hverdag). Bruges til faste dage/anker — modsat 'sidste bankdag'. */
export function nextBankDay(date: DateTime): DateTime {
  let d = date;
  while (isBankClosed(d)) d = d.plus({ days: 1 });
  return d;
}
