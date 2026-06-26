import BigNumber from 'bignumber.js';

import type { WithId } from '@/lib/firebase';
import type { Loan } from './types';

/** Fremgang (0–1): hvor stor en del af det oprindelige beløb der er afdraget. */
export function loanProgress(loan: Loan): number {
  const original = new BigNumber(loan.originalAmount);
  if (original.lte(0)) return 0;
  const ratio = original.minus(loan.currentBalance).div(original);
  return BigNumber.minimum(1, BigNumber.maximum(0, ratio)).toNumber();
}

/** Fremgang som heltalsprocent (0–100). */
export function progressPercent(loan: Loan): number {
  return new BigNumber(loanProgress(loan)).times(100).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}

/** Samlet restgæld over alle lån (øre). */
export function totalBalance(loans: WithId<Loan>[]): number {
  return loans.reduce((sum, l) => sum.plus(l.currentBalance), new BigNumber(0)).toNumber();
}

/** Samlet månedlig ydelse over alle lån (øre). */
export function totalMonthlyPayment(loans: WithId<Loan>[]): number {
  return loans.reduce((sum, l) => sum.plus(l.monthlyPayment), new BigNumber(0)).toNumber();
}
