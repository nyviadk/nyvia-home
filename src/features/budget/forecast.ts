import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import { monthlyAverageOre, occursInMonth } from '@/lib/recurrence/engine';
import type { Recurrence } from '@/lib/recurrence/types';

/** En gentaget regel med beløb (øre, positivt). */
export type ForecastRule = { amount: number; recurrence: Recurrence };

/**
 * Afkoblet input til forecasten. Dashboardet samler det fra budget-poster,
 * aktive abonnementer og lån-ydelser.
 */
export type ForecastInput = {
  incomeRules: ForecastRule[];
  expenseRules: ForecastRule[];
  /** Faste månedlige udgifter uden egen regel (fx lån-ydelser) — trækkes hver måned. */
  fixedMonthlyExpenseOre: number;
};

export type MonthForecast = {
  ym: string;
  income: number;
  expenses: number;
  net: number;
};

function sumOccurring(rules: ForecastRule[], year: number, month: number): number {
  return rules
    .reduce((sum, r) => (occursInMonth(r.recurrence, year, month) ? sum.plus(r.amount) : sum), new BigNumber(0))
    .toNumber();
}

/** Forecast for én måned (realistisk: kun poster der faktisk falder den måned). */
export function monthForecast(year: number, month: number, input: ForecastInput): MonthForecast {
  const income = sumOccurring(input.incomeRules, year, month);
  const expenses = new BigNumber(sumOccurring(input.expenseRules, year, month))
    .plus(input.fixedMonthlyExpenseOre)
    .toNumber();
  return {
    ym: DateTime.fromObject({ year, month }, { zone: APP_TIMEZONE }).toFormat('yyyy-MM'),
    income,
    expenses,
    net: new BigNumber(income).minus(expenses).toNumber(),
  };
}

/** Nuværende måned + de næste (count-1) måneder. */
export function forecastMonths(count: number, input: ForecastInput): MonthForecast[] {
  const start = DateTime.now().setZone(APP_TIMEZONE).startOf('month');
  const out: MonthForecast[] = [];
  for (let i = 0; i < count; i++) {
    const d = start.plus({ months: i });
    out.push(monthForecast(d.year, d.month, input));
  }
  return out;
}

/** Gennemsnitligt månedligt rådighedsbeløb (udjævner kvartal/år). */
export function averageDisposableOre(input: ForecastInput): number {
  const avg = (rules: ForecastRule[]) =>
    rules.reduce((sum, r) => sum.plus(monthlyAverageOre(r.amount, r.recurrence)), new BigNumber(0));
  return avg(input.incomeRules)
    .minus(avg(input.expenseRules))
    .minus(input.fixedMonthlyExpenseOre)
    .toNumber();
}
