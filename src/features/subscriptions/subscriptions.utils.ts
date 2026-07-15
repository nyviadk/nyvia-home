import BigNumber from 'bignumber.js';

import type { WithId } from '@/lib/firebase';
import { monthlyAverageOre } from '@/lib/recurrence/engine';
import type { Subscription } from './types';

/** Samlet gennemsnitligt månedligt bidrag (øre) for aktive abonnementer — den RENE årlige sats
 *  (forekomster pr. år ÷ 12), uafhængig af dato/ankermåned. Fx hver 2. år = beløb ÷ 24.
 *  (Budget-siden bruger derimod den vindue-baserede `averageMonthlyOre`, som skal ramme
 *  rådighedsbeløbet i de konkrete måneder poster falder.) */
export function totalMonthlyAverageOre(subscriptions: WithId<Subscription>[]): number {
  return subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum.plus(monthlyAverageOre(s.amount, s.recurrence)), new BigNumber(0))
    .toNumber();
}
