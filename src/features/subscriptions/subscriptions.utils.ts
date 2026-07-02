import BigNumber from 'bignumber.js';

import type { WithId } from '@/lib/firebase';
import { averageMonthlyOre } from '@/lib/recurrence/engine';
import type { Subscription } from './types';

/** Samlet gennemsnitligt månedligt bidrag (øre) for aktive abonnementer over de kommende
 *  `count` måneder fra `anchorISO` (respekterer start/slut). */
export function totalMonthlyAverageOre(
  subscriptions: WithId<Subscription>[],
  anchorISO: string,
  count: number,
): number {
  return subscriptions
    .filter((s) => s.active)
    .reduce(
      (sum, s) => sum.plus(averageMonthlyOre(s.amount, s.recurrence, anchorISO, count)),
      new BigNumber(0)
    )
    .toNumber();
}
