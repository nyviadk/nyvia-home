import BigNumber from 'bignumber.js';

import type { WithId } from '@/lib/firebase';
import { monthlyAverageOre } from '@/lib/recurrence/engine';
import type { Subscription } from './types';

/** Samlet gennemsnitligt månedligt bidrag (øre) for aktive abonnementer. */
export function totalMonthlyAverageOre(subscriptions: WithId<Subscription>[]): number {
  return subscriptions
    .filter((s) => s.active)
    .reduce(
      (sum, s) => sum.plus(monthlyAverageOre(s.amount, s.recurrence)),
      new BigNumber(0)
    )
    .toNumber();
}
