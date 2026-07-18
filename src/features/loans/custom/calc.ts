import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import type { CustomLoan, ExpenseTable, LoanLineItem, RepaymentHorizon } from './types';

const ZERO = new BigNumber(0);
const ROUND = BigNumber.ROUND_HALF_UP;

/** En posts beløb (øre, signed) — summen af children hvis de findes, ellers amount. */
export function lineItemTotalOre(item: LoanLineItem): number {
  if (item.children && item.children.length > 0) {
    return item.children.reduce((sum, c) => sum.plus(c.amount), ZERO).toNumber();
  }
  return item.amount;
}

/** Hovedstol = sum af inkluderede posters beløb (øre, signed). */
export function principalOre(items: LoanLineItem[]): number {
  return items
    .reduce((sum, i) => (i.included ? sum.plus(lineItemTotalOre(i)) : sum), ZERO)
    .toNumber();
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
  // Ingen hovedstol (fx line items fjernet) → intet afdrag. Uden dette ville 'asap'-afdraget
  // stadig være rådighedsbeløbet (gammel − ny bolig), selvom der intet lån er at betale af.
  if (principal.lte(0)) return 0;
  if (loan.horizon === 'm24') return principal.div(24).integerValue(ROUND).toNumber();
  if (loan.horizon === 'm48') return principal.div(48).integerValue(ROUND).toNumber();
  // 'asap': fuldt rådighedsbeløb minus evt. buffer.
  const buffer = loan.buffer.enabled ? loan.buffer.amount : 0;
  return BigNumber.maximum(0, new BigNumber(monthlyAvailableOre(loan)).minus(buffer)).toNumber();
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

/** Fail-safe så tabellen ikke kan loope uendeligt ved 0-afdrag. */
const MAX_MONTHS = 600;

/**
 * Afbetalingstabel måned for måned — DYNAMISK længde. Hver måned nedskrives
 * restgælden med det faktiske afdrag hvis indtastet, ellers det forventede, og
 * tabellen kører til gælden er betalt. Betaler man fx 0 i en måned, forlænges
 * planen tilsvarende i bunden (og afkortes hvis man betaler ekstra).
 */
export function buildSchedule(loan: CustomLoan): ScheduleRow[] {
  const expected = monthlyPaymentOre(loan);
  const start = DateTime.fromISO(`${loan.startMonth}-01`, { zone: APP_TIMEZONE });

  let remaining = new BigNumber(principalOre(loan.lineItems));
  const rows: ScheduleRow[] = [];
  for (let k = 0; k < MAX_MONTHS && remaining.gt(0); k++) {
    const ym = start.plus({ months: k }).toFormat('yyyy-MM');
    const actual = loan.actuals[ym] ?? null;
    const paid = actual ?? expected;
    // Intet afdrag og intet indtastet → ingen fremgang mulig; stop.
    if (paid <= 0 && actual === null) break;
    remaining = remaining.minus(paid);
    rows.push({ ym, expected, actual, remaining: remaining.toNumber() });
  }
  return rows;
}

/** Antal måneder til lånet er betalt ud fra den dynamiske plan (Infinity hvis ikke). */
export function payoffMonths(loan: CustomLoan): number {
  const rows = buildSchedule(loan);
  const last = rows[rows.length - 1];
  return last && last.remaining <= 0 ? rows.length : Infinity;
}
