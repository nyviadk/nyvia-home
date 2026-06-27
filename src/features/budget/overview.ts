import BigNumber from 'bignumber.js';

import { monthlyAverageOre } from '@/lib/recurrence/engine';
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

function sumAvg(rules: ForecastRule[]): BigNumber {
  return rules.reduce(
    (sum, r) => sum.plus(monthlyAverageOre(r.amount, r.recurrence)),
    new BigNumber(0)
  );
}

/** Gennemsnitligt månedligt overblik (udjævner kvartal/halvår/år via monthlyAverageOre). */
export function budgetOverview(input: OverviewInput): BudgetOverview {
  const income = sumAvg(input.incomeRules);
  const expense = sumAvg(input.expenseRules);
  const subscriptions = sumAvg(input.subscriptionRules);
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
