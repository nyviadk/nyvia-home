import BigNumber from 'bignumber.js';

import type { WithId } from '@/lib/firebase';
import { currentRemainingOre, monthlyPaymentOre } from './custom/calc';
import { type AnyLoan, isCustomLoan, type Loan } from './types';

/** Fremgang (0–1) for et standard-lån: andel af oprindeligt beløb der er afdraget. */
export function loanProgress(loan: Loan): number {
  const original = new BigNumber(loan.originalAmount);
  if (original.lte(0)) return 0;
  const ratio = original.minus(loan.currentBalance).div(original);
  return BigNumber.minimum(1, BigNumber.maximum(0, ratio)).toNumber();
}

/** Fremgang som heltalsprocent (0–100) for et standard-lån. */
export function progressPercent(loan: Loan): number {
  return new BigNumber(loanProgress(loan)).times(100).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}

/** Aktuel restgæld for et vilkårligt lån (øre). */
export function remainingOre(loan: AnyLoan): number {
  return isCustomLoan(loan) ? currentRemainingOre(loan) : loan.currentBalance;
}

/** Månedlig ydelse for et vilkårligt lån (øre). */
export function monthlyOre(loan: AnyLoan): number {
  return isCustomLoan(loan) ? monthlyPaymentOre(loan) : loan.monthlyPayment;
}

/** Samlet restgæld over alle lån (øre). */
export function totalBalance(loans: WithId<AnyLoan>[]): number {
  return loans.reduce((sum, l) => sum.plus(remainingOre(l)), new BigNumber(0)).toNumber();
}

/** Samlet månedlig ydelse over alle lån (øre). */
export function totalMonthlyPayment(loans: WithId<AnyLoan>[]): number {
  return loans.reduce((sum, l) => sum.plus(monthlyOre(l)), new BigNumber(0)).toNumber();
}
