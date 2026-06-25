import type { WithId } from '@/lib/firebase';
import type { Loan } from './types';

/** Fremgang (0–1): hvor stor en del af det oprindelige beløb der er afdraget. */
export function loanProgress(loan: Loan): number {
  if (loan.originalAmount <= 0) return 0;
  const paid = loan.originalAmount - loan.currentBalance;
  return Math.min(1, Math.max(0, paid / loan.originalAmount));
}

/** Samlet restgæld over alle lån (øre). */
export function totalBalance(loans: WithId<Loan>[]): number {
  return loans.reduce((sum, l) => sum + l.currentBalance, 0);
}

/** Samlet månedlig ydelse over alle lån (øre). */
export function totalMonthlyPayment(loans: WithId<Loan>[]): number {
  return loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
}
