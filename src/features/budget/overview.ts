import BigNumber from 'bignumber.js';

import { averageMonthlyOre } from '@/lib/recurrence/engine';
import type { ForecastRule } from './forecast';

/** Strukturerede regler så nedbrydningen kan vises pr. linje (modsat den flade ForecastInput). */
export type OverviewInput = {
  incomeRules: ForecastRule[];
  expenseRules: ForecastRule[];
  subscriptionRules: ForecastRule[];
  /** Lån-ydelser (allerede månedligt beløb i øre). */
  loansMonthlyOre: number;
  /** Automatisk opsparing i procent af resterende rådighedsbeløb. */
  savingsPercent: number;
  /** Ankermåned (ÅÅÅÅ-MM-DD) for horisont-gennemsnittet + antal måneder (typisk 12). */
  anchorISO: string;
  count: number;
};

/** Udjævnede månedlige gennemsnit (øre) pr. linje + rådighedsbeløb. */
export type BudgetOverview = {
  incomeOre: number;
  expenseOre: number;
  subscriptionsOre: number;
  loansOre: number;
  savingsOre: number;
  disposableOre: number;
};

function sumAvg(rules: ForecastRule[], anchorISO: string, count: number): BigNumber {
  return rules.reduce(
    (sum, r) => sum.plus(averageMonthlyOre(r.amount, r.recurrence, anchorISO, count)),
    new BigNumber(0)
  );
}

/** Gennemsnitligt månedligt overblik over de kommende `count` måneder (respekterer start/slut). */
export function budgetOverview(input: OverviewInput): BudgetOverview {
  const { anchorISO, count } = input;
  const income = sumAvg(input.incomeRules, anchorISO, count);
  const expense = sumAvg(input.expenseRules, anchorISO, count);
  const subscriptions = sumAvg(input.subscriptionRules, anchorISO, count);
  const loans = new BigNumber(input.loansMonthlyOre);
  // Opsparing = procent af resterende rådighedsbeløb (kun hvis positivt).
  const base = income.minus(expense).minus(subscriptions).minus(loans);
  const savings =
    input.savingsPercent > 0 && base.gt(0)
      ? base.times(input.savingsPercent).div(100).integerValue(BigNumber.ROUND_HALF_UP)
      : new BigNumber(0);
  const disposable = base.minus(savings);
  return {
    incomeOre: income.toNumber(),
    expenseOre: expense.toNumber(),
    subscriptionsOre: subscriptions.toNumber(),
    loansOre: loans.toNumber(),
    savingsOre: savings.toNumber(),
    disposableOre: disposable.toNumber(),
  };
}
