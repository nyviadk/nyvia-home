import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import { lastBankDayOfMonth, previousBankDay } from './danish-holidays';
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
    case 'yearly':
      return diff % 12 === 0;
  }
}

/** Den konkrete dato reglen falder på i måneden (ÅÅÅÅ-MM-DD), eller null hvis ingen. */
export function occurrenceDate(rule: Recurrence, year: number, month: number): string | null {
  if (!occursInMonth(rule, year, month)) return null;
  const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE });
  const base = monthStart(year, month);
  const daysInMonth = base.daysInMonth ?? 28;

  let date: DateTime;
  let isLastDay = false;

  if (rule.cadence === 'monthly') {
    const md = rule.monthlyDay ?? start.day;
    if (md === 'last') {
      date = base.endOf('month').startOf('day');
      isLastDay = true;
    } else if (md === 'lastBank') {
      date = lastBankDayOfMonth(year, month);
    } else {
      date = base.set({ day: Math.min(md, daysInMonth) });
    }
  } else {
    // kvartal/år/engang: brug ankerdatoens dag-i-måneden
    date = base.set({ day: Math.min(start.day, daysInMonth) });
  }

  // En fast dag der falder på en bank-lukket dag rykkes til foregående bankdag
  // (overførsler kan ikke ske på helligdage). "Sidste dag" beholdes som kalenderdag.
  if (!isLastDay) date = previousBankDay(date);

  return date.toFormat('yyyy-MM-dd');
}

/** Gennemsnitligt månedligt bidrag (øre): forekomster pr. år ÷ 12. */
export function monthlyAverageOre(amountOre: number, rule: Recurrence): number {
  const perYear =
    rule.cadence === 'monthly' ? 12 : rule.cadence === 'quarterly' ? 4 : rule.cadence === 'yearly' ? 1 : 0;
  return new BigNumber(amountOre).times(perYear).div(12).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}
