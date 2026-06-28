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

/** Falder reglen i den givne måned? */
export function occursInMonth(rule: Recurrence, year: number, month: number): boolean {
  const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE });
  const target = monthStart(year, month);
  if (target < start.startOf('month')) return false;
  if (rule.endDate) {
    const end = DateTime.fromISO(rule.endDate, { zone: APP_TIMEZONE }).endOf('month');
    if (target > end) return false;
  }
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

/** Den konkrete dato reglen falder på i måneden (ÅÅÅÅ-MM-DD), eller null hvis ingen. */
export function occurrenceDate(rule: Recurrence, year: number, month: number): string | null {
  if (!occursInMonth(rule, year, month)) return null;
  const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE });
  const base = monthStart(year, month);
  const daysInMonth = base.daysInMonth ?? 28;

  let date: DateTime;

  if (rule.cadence === 'monthly') {
    const md = rule.monthlyDay ?? start.day;
    if (md === 'month') {
      // Ingen bestemt dag (kun måneden tæller).
      return null;
    } else if (md === 'lastBank') {
      // Allerede en bankdag → previousBankDay nedenfor er et no-op.
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

  // En fast dag der falder på en bank-lukket dag rykkes til foregående bankdag
  // (overførsler kan ikke ske på helligdage). Bankdag-valgene rammer allerede en
  // bankdag, så previousBankDay er da et no-op.
  date = previousBankDay(date);

  return date.toFormat('yyyy-MM-dd');
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

/** Gennemsnitligt månedligt bidrag (øre): forekomster pr. år ÷ 12. */
export function monthlyAverageOre(amountOre: number, rule: Recurrence): number {
  return new BigNumber(amountOre)
    .times(occurrencesPerYear(rule.cadence))
    .div(12)
    .integerValue(BigNumber.ROUND_HALF_UP)
    .toNumber();
}
