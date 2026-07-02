import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import { firstBankDayOfMonth, lastBankDayOfMonth, previousBankDay } from './danish-holidays';
import type { Recurrence } from './types';

function monthStart(year: number, month: number): DateTime {
  return DateTime.fromObject({ year, month, day: 1 }, { zone: APP_TIMEZONE });
}

/** Hele måneder mellem to måneds-starter (kan være negativt). */
function monthsBetween(from: DateTime, to: DateTime): number {
  return Math.round(to.diff(from.startOf('month'), 'months').months);
}

/** Rammer cadencen den givne måned (uden slut-grænse)? Start tjekkes på måneds-niveau. */
function matchesCadenceInMonth(rule: Recurrence, year: number, month: number): boolean {
  const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE });
  const target = monthStart(year, month);
  if (target < start.startOf('month')) return false;
  const diff = monthsBetween(start, target);
  switch (rule.cadence) {
    case 'once':
      return diff === 0;
    case 'monthly':
      return true;
    case 'quarterly':
      return diff % 3 === 0;
    case 'half_yearly':
      return diff % 6 === 0;
    case 'yearly':
      return diff % 12 === 0;
    case 'biennial':
      return diff % 24 === 0;
    case 'triennial':
      return diff % 36 === 0;
  }
}

/**
 * Forekomstens faktiske (bank-justerede) dato i måneden, eller null for 'month'-dag
 * (ingen bestemt dato). Antager at cadencen rammer måneden.
 */
function occurrenceDayInMonth(rule: Recurrence, year: number, month: number): DateTime | null {
  const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE });
  const base = monthStart(year, month);
  const daysInMonth = base.daysInMonth ?? 28;

  let date: DateTime;
  if (rule.cadence === 'monthly') {
    const md = rule.monthlyDay ?? start.day;
    if (md === 'month') {
      return null; // ingen bestemt dag (kun måneden tæller)
    } else if (md === 'lastBank') {
      date = lastBankDayOfMonth(year, month);
    } else if (md === 'firstBank') {
      date = firstBankDayOfMonth(year, month);
    } else {
      date = base.set({ day: Math.min(md, daysInMonth) });
    }
  } else {
    // kvartal/halvår/år/engang: brug ankerdatoens dag-i-måneden
    date = base.set({ day: Math.min(start.day, daysInMonth) });
  }
  // En fast dag der falder på en bank-lukket dag rykkes til foregående bankdag.
  return previousBankDay(date);
}

/**
 * Falder reglen i den givne måned? Start- OG slutdato tjekkes mod forekomstens FAKTISKE
 * (bank-justerede) dato — ikke bare start/slut-måneden: en betaling der ville falde FØR
 * startdatoen eller EFTER slutdatoen tæller ikke med (fx sidste bankdag ≈ 26. feb tæller
 * ikke når slutdatoen er 5. feb). 'month'-dag (ingen bestemt dato) bruger måneds-grænsen.
 */
export function occursInMonth(rule: Recurrence, year: number, month: number): boolean {
  if (!matchesCadenceInMonth(rule, year, month)) return false;
  const occ = occurrenceDayInMonth(rule, year, month);
  if (occ) {
    const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE }).startOf('day');
    if (occ < start) return false;
    if (rule.endDate) {
      const end = DateTime.fromISO(rule.endDate, { zone: APP_TIMEZONE }).endOf('day');
      if (occ > end) return false;
    }
    return true;
  }
  // 'month'-dag (ingen bestemt dato): brug måneds-grænsen (start er dækket coarse ovenfor).
  if (rule.endDate) {
    const end = DateTime.fromISO(rule.endDate, { zone: APP_TIMEZONE }).endOf('month');
    if (monthStart(year, month) > end) return false;
  }
  return true;
}

/** Den konkrete dato reglen falder på i måneden (ÅÅÅÅ-MM-DD), eller null hvis ingen. */
export function occurrenceDate(rule: Recurrence, year: number, month: number): string | null {
  if (!occursInMonth(rule, year, month)) return null;
  const occ = occurrenceDayInMonth(rule, year, month);
  return occ ? occ.toFormat('yyyy-MM-dd') : null;
}

/** Forekomster pr. år for en cadence (engang = 0 → indgår ikke i månedsgennemsnit). */
function occurrencesPerYear(cadence: Recurrence['cadence']): number {
  switch (cadence) {
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'half_yearly':
      return 2;
    case 'yearly':
      return 1;
    case 'biennial':
      return 0.5;
    case 'triennial':
      return 1 / 3;
    case 'once':
      return 0;
  }
}

/** Gennemsnitligt månedligt bidrag (øre): forekomster pr. år ÷ 12. Ser IKKE på start/slut
 *  → brug kun til per-måned-udjævning sammen med `isActiveInMonth`. */
export function monthlyAverageOre(amountOre: number, rule: Recurrence): number {
  return new BigNumber(amountOre)
    .times(occurrencesPerYear(rule.cadence))
    .div(12)
    .integerValue(BigNumber.ROUND_HALF_UP)
    .toNumber();
}

/** Er reglen aktiv i måneden? — til udjævnet ("hensat") visning. Månedlige poster bruger
 *  den præcise per-forekomst-logik (så en betaling efter slutdatoen heller ikke tæller her);
 *  periodiske poster udjævnes over hele det aktive vindue [start-måned, slut-måned]. */
export function isActiveInMonth(rule: Recurrence, year: number, month: number): boolean {
  if (rule.cadence === 'monthly') return occursInMonth(rule, year, month);
  const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE });
  const target = monthStart(year, month);
  if (target < start.startOf('month')) return false;
  if (rule.endDate) {
    const end = DateTime.fromISO(rule.endDate, { zone: APP_TIMEZONE }).endOf('month');
    if (target > end) return false;
  }
  return true;
}

/**
 * Gennemsnitligt månedligt bidrag (øre) over en horisont på `count` måneder fra
 * `anchorISO` — tæller kun de forekomster der FAKTISK falder (respekterer start/slut).
 * Konsistent med den realistiske forecast: en post der slutter halvvejs tæller kun i de
 * måneder den er aktiv. For evige poster er resultatet identisk med `monthlyAverageOre`.
 */
export function averageMonthlyOre(
  amountOre: number,
  rule: Recurrence,
  anchorISO: string,
  count: number,
): number {
  const base = DateTime.fromISO(anchorISO, { zone: APP_TIMEZONE }).startOf('month');
  let occurrences = 0;
  for (let i = 0; i < count; i++) {
    const d = base.plus({ months: i });
    if (occursInMonth(rule, d.year, d.month)) occurrences++;
  }
  return new BigNumber(amountOre)
    .times(occurrences)
    .div(count)
    .integerValue(BigNumber.ROUND_HALF_UP)
    .toNumber();
}
