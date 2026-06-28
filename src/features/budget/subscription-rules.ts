import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import { occursInMonth } from '@/lib/recurrence/engine';
import type { Subscription } from '@/features/subscriptions/types';
import type { ForecastRule } from './forecast';
import { effectivePriceOre, ym } from './pricing';

function addMonthsISO(iso: string, months: number): string {
  return DateTime.fromISO(iso, { zone: APP_TIMEZONE }).plus({ months }).toISODate() ?? iso;
}

/**
 * Oversætter et abonnement til forecast-regler. Uden intro: én regel. Med intro:
 * én engangsbetaling i startmåneden + den normale (forskudt så den først tæller efter
 * intro-perioden). Dermed rører vi ikke selve forecast-motoren.
 */
export function subscriptionToRules(sub: Subscription): ForecastRule[] {
  const steady: ForecastRule = {
    amount: sub.amount,
    recurrence: sub.intro
      ? { ...sub.recurrence, startDate: addMonthsISO(sub.recurrence.startDate, sub.intro.months) }
      : sub.recurrence,
    priceChanges: sub.priceChanges,
  };
  if (!sub.intro) return [steady];

  const introRule: ForecastRule = {
    amount: sub.intro.amountOre,
    recurrence: { cadence: 'once', startDate: sub.recurrence.startDate },
  };
  return [introRule, steady];
}

/** Hvad abonnementet trækker i en given måned (intro-engangsbeløb + normal), i øre. */
export function subscriptionChargeInMonth(
  sub: Subscription,
  year: number,
  month: number
): number {
  const monthYm = ym(year, month);
  return subscriptionToRules(sub).reduce(
    (sum, r) =>
      sum + (occursInMonth(r.recurrence, year, month) ? effectivePriceOre(r.amount, r.priceChanges, monthYm) : 0),
    0
  );
}
