import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import type { CustomLoan, ExpenseTable, LoanLineItem, RepaymentHorizon } from './types';

const ZERO = new BigNumber(0);
const ROUND = BigNumber.ROUND_HALF_UP;

/** Hovedstol = sum af inkluderede poster (øre). */
export function principalOre(items: LoanLineItem[]): number {
  return items.reduce((sum, i) => (i.included ? sum.plus(i.amount) : sum), ZERO).toNumber();
}

/** Sum af en udgiftstabels rækker (øre). */
export function expenseTotalOre(table: ExpenseTable): number {
  return table.rows.reduce((sum, r) => sum.plus(r.amount), ZERO).toNumber();
}

/** Sum af alle indtastede faktiske afdrag (øre). */
export function totalActualsOre(loan: Pick<CustomLoan, 'actuals'>): number {
  return Object.values(loan.actuals).reduce((sum, v) => sum.plus(v), ZERO).toNumber();
}

/** Aktuel restgæld = hovedstol − faktiske afdrag (øre). */
export function currentRemainingOre(loan: Pick<CustomLoan, 'lineItems' | 'actuals'>): number {
  return new BigNumber(principalOre(loan.lineItems)).minus(totalActualsOre(loan)).toNumber();
}

/** Rådighedsbeløb/md = nuværende bolig − ny bolig (øre). */
export function monthlyAvailableOre(loan: Pick<CustomLoan, 'oldHome' | 'newHome'>): number {
  return new BigNumber(expenseTotalOre(loan.oldHome))
    .minus(expenseTotalOre(loan.newHome))
    .toNumber();
}

type PaymentInput = Pick<
  CustomLoan,
  'lineItems' | 'oldHome' | 'newHome' | 'buffer' | 'horizon'
>;

/** Månedligt afdrag (øre) afhængigt af horisont + buffer. */
export function monthlyPaymentOre(loan: PaymentInput): number {
  const principal = new BigNumber(principalOre(loan.lineItems));
  if (loan.horizon === 'm24') return principal.div(24).integerValue(ROUND).toNumber();
  if (loan.horizon === 'm48') return principal.div(48).integerValue(ROUND).toNumber();
  // 'asap': fuldt rådighedsbeløb minus evt. buffer.
  const buffer = loan.buffer.enabled ? loan.buffer.amount : 0;
  return BigNumber.maximum(0, new BigNumber(monthlyAvailableOre(loan)).minus(buffer)).toNumber();
}

/** Antal måneder til lånet er betalt (Infinity hvis afdrag ≤ 0). */
export function payoffMonths(loan: PaymentInput): number {
  const payment = monthlyPaymentOre(loan);
  if (payment <= 0) return Infinity;
  return new BigNumber(principalOre(loan.lineItems)).div(payment).integerValue(BigNumber.ROUND_CEIL).toNumber();
}

/** Opsparing efter n måneder = n × afdrag − hovedstol (øre; negativ = stadig gæld). */
export function savingsAfterOre(loan: PaymentInput, months: number): number {
  return new BigNumber(monthlyPaymentOre(loan))
    .times(months)
    .minus(principalOre(loan.lineItems))
    .toNumber();
}

export type ScheduleRow = {
  /** ÅÅÅÅ-MM. */
  ym: string;
  /** Forventet afdrag (øre). */
  expected: number;
  /** Faktisk afdrag (øre) hvis indtastet, ellers null. */
  actual: number | null;
  /** Restgæld efter denne måned (øre; negativ = opsparing). */
  remaining: number;
};

/** Hvor mange måneder tabellen viser, ud fra horisont. */
export function scheduleLength(loan: PaymentInput): number {
  if (loan.horizon === 'm24') return 24;
  if (loan.horizon === 'm48') return 48;
  const payoff = payoffMonths(loan);
  return Number.isFinite(payoff) ? payoff : 0;
}

/**
 * Afbetalingstabel måned for måned. Restgæld nedskrives med det faktiske afdrag
 * hvis det er indtastet for måneden, ellers det forventede.
 */
export function buildSchedule(loan: CustomLoan): ScheduleRow[] {
  const expected = monthlyPaymentOre(loan);
  const months = scheduleLength(loan);
  const start = DateTime.fromISO(`${loan.startMonth}-01`, { zone: APP_TIMEZONE });

  let remaining = new BigNumber(principalOre(loan.lineItems));
  const rows: ScheduleRow[] = [];
  for (let k = 0; k < months; k++) {
    const ym = start.plus({ months: k }).toFormat('yyyy-MM');
    const actual = loan.actuals[ym] ?? null;
    const paid = actual ?? expected;
    remaining = remaining.minus(paid);
    rows.push({ ym, expected, actual, remaining: remaining.toNumber() });
  }
  return rows;
}
