import { DateTime } from 'luxon';

import { APP_TIMEZONE, todayISODate } from '@/lib/datetime';

/**
 * Default-startdato for en NY post: budgettets startdato hvis den ligger i fremtiden,
 * ellers i dag. Undgår at autofylde en dato før budgettets start (mindste dato).
 */
export function defaultStartDate(budgetStart: string | null): string {
  const today = todayISODate();
  if (budgetStart && budgetStart > today) return budgetStart;
  return today;
}

/**
 * Nedre grænse for en posts startdato (ÅÅÅÅ-MM-DD), givet budgettets startdato.
 * Forudbetalte poster (forudløn) udbetales måneden før, så de må starte fra
 * begyndelsen af måneden før budgetstart. Returnerer null hvis ingen startdato er sat.
 */
export function effectiveStartMin(budgetStart: string | null, advanceMonth: boolean): string | null {
  if (!budgetStart) return null;
  const start = DateTime.fromISO(budgetStart, { zone: APP_TIMEZONE });
  if (!advanceMonth) return budgetStart;
  return start.minus({ months: 1 }).startOf('month').toFormat('yyyy-MM-dd');
}
