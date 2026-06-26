import BigNumber from 'bignumber.js';

import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import type { CustomLoan } from '../custom/types';
import type { AnyLoan, Loan, LoanInput, Payment } from '../types';

/** Custom-lån uden afledte/tidsstempel-felter (det brugeren redigerer). */
export type CustomLoanInput = Omit<CustomLoan, 'createdAt' | 'updatedAt'>;

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const loansPath = () => `users/${requireUid()}/loans`;
const loanPath = (id: string) => `${loansPath()}/${id}`;
const paymentsPath = (loanId: string) => `${loanPath(loanId)}/payments`;

export function subscribeLoans(
  onChange: (snap: CollectionSnapshot<AnyLoan>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<AnyLoan>(
    loansPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError
  );
}

export function subscribeLoan(
  id: string,
  onChange: (loan: WithId<AnyLoan> | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeDoc<AnyLoan>(loanPath(id), onChange, onError);
}

export function createLoan(input: LoanInput): Promise<string> {
  const now = nowISO();
  return db.addDoc<Loan>(loansPath(), { ...input, type: 'standard', createdAt: now, updatedAt: now });
}

export function updateLoan(id: string, input: LoanInput): Promise<void> {
  return db.updateDoc(loanPath(id), { ...input, updatedAt: nowISO() });
}

export function createCustomLoan(input: CustomLoanInput): Promise<string> {
  const now = nowISO();
  return db.addDoc<CustomLoan>(loansPath(), { ...input, createdAt: now, updatedAt: now });
}

export function updateCustomLoan(id: string, input: CustomLoanInput): Promise<void> {
  return db.updateDoc(loanPath(id), { ...input, updatedAt: nowISO() });
}

/** Gem kun de faktiske afdrag (faktisk-vs-forventet). */
export function updateCustomActuals(id: string, actuals: Record<string, number>): Promise<void> {
  return db.updateDoc(loanPath(id), { actuals, updatedAt: nowISO() });
}

/** Gem kun posterne (bruges af medtag/fravælg-filteret i oversigten). */
export function updateCustomLineItems(
  id: string,
  lineItems: CustomLoan['lineItems']
): Promise<void> {
  return db.updateDoc(loanPath(id), { lineItems, updatedAt: nowISO() });
}

/** Gem kun afbetalings-horisonten (vælges dynamisk i afbetalingsplanen). */
export function updateCustomHorizon(id: string, horizon: CustomLoan['horizon']): Promise<void> {
  return db.updateDoc(loanPath(id), { horizon, updatedAt: nowISO() });
}

/** Gem kun én udgiftstabel (ny/nuværende bolig) — inline-redigering i oversigten. */
export function updateCustomExpenseTable(
  id: string,
  key: 'newHome' | 'oldHome',
  table: CustomLoan['newHome']
): Promise<void> {
  return db.updateDoc(loanPath(id), { [key]: table, updatedAt: nowISO() });
}

export function deleteLoan(id: string): Promise<void> {
  return db.deleteDoc(loanPath(id));
}

export function subscribePayments(
  loanId: string,
  onChange: (snap: CollectionSnapshot<Payment>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<Payment>(
    paymentsPath(loanId),
    { orderByField: 'date', orderDirection: 'desc' },
    onChange,
    onError
  );
}

/**
 * Registrerer et afdrag og nedskriver lånets restgæld (last-write-wins, offline-ok).
 * `currentBalance` er den kendte restgæld fra UI'et før afdraget.
 */
export async function addPayment(
  loanId: string,
  currentBalance: number,
  payment: { amount: number; date: string; note?: string }
): Promise<void> {
  const base: Payment = { amount: payment.amount, date: payment.date, createdAt: nowISO() };
  const data: Payment = payment.note ? { ...base, note: payment.note } : base;
  await db.addDoc<Payment>(paymentsPath(loanId), data);
  const newBalance = BigNumber.maximum(0, new BigNumber(currentBalance).minus(payment.amount)).toNumber();
  await db.updateDoc(loanPath(loanId), {
    currentBalance: newBalance,
    updatedAt: nowISO(),
  });
}
