import BigNumber from 'bignumber.js';

import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
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
  return toastAfter(
    db.addDoc<Loan>(loansPath(), { ...input, type: 'standard', createdAt: now, updatedAt: now }),
    'Lån oprettet'
  );
}

export function updateLoan(id: string, input: LoanInput): Promise<void> {
  return toastAfter(db.updateDoc(loanPath(id), { ...input, updatedAt: nowISO() }), 'Gemt');
}

export function createCustomLoan(input: CustomLoanInput): Promise<string> {
  const now = nowISO();
  return toastAfter(
    db.addDoc<CustomLoan>(loansPath(), { ...input, createdAt: now, updatedAt: now }),
    'Lån oprettet'
  );
}

export function updateCustomLoan(id: string, input: CustomLoanInput): Promise<void> {
  return toastAfter(db.updateDoc(loanPath(id), { ...input, updatedAt: nowISO() }), 'Gemt');
}

/** Gem kun de faktiske afdrag (faktisk-vs-forventet). */
export function updateCustomActuals(id: string, actuals: Record<string, number>): Promise<void> {
  return toastAfter(
    db.updateDoc(loanPath(id), { actuals, updatedAt: nowISO() }),
    'Faktisk afdrag gemt'
  );
}

/** Gem kun posterne (bruges af medtag/fravælg-filteret i oversigten). */
export function updateCustomLineItems(
  id: string,
  lineItems: CustomLoan['lineItems']
): Promise<void> {
  return toastAfter(
    db.updateDoc(loanPath(id), { lineItems, updatedAt: nowISO() }),
    'Poster opdateret'
  );
}

/** Gem kun afbetalings-horisonten (vælges dynamisk i afbetalingsplanen). */
export function updateCustomHorizon(id: string, horizon: CustomLoan['horizon']): Promise<void> {
  return toastAfter(
    db.updateDoc(loanPath(id), { horizon, updatedAt: nowISO() }),
    'Tidshorisont opdateret'
  );
}

/** Gem kun buffer (vælges i afbetalingsplanen, kun relevant ved 'asap'). */
export function updateCustomBuffer(id: string, buffer: CustomLoan['buffer']): Promise<void> {
  return toastAfter(db.updateDoc(loanPath(id), { buffer, updatedAt: nowISO() }), 'Buffer opdateret');
}

/** Gem kun én udgiftstabel (ny/nuværende bolig) — inline-redigering i oversigten. */
export function updateCustomExpenseTable(
  id: string,
  key: 'newHome' | 'oldHome',
  table: CustomLoan['newHome']
): Promise<void> {
  return toastAfter(db.updateDoc(loanPath(id), { [key]: table, updatedAt: nowISO() }), 'Udgifter gemt');
}

export function deleteLoan(id: string): Promise<void> {
  return db.deleteDoc(loanPath(id));
}

/**
 * Registrerer et afdrag i lån-dokumentets `payments`-array og nedskriver restgælden
 * (last-write-wins, offline-ok). Ingen subcollection → ingen ekstra listener.
 */
export function addPayment(
  loanId: string,
  currentBalance: number,
  existingPayments: Payment[],
  payment: { amount: number; date: string; note?: string }
): Promise<void> {
  const base: Payment = { id: genId(), amount: payment.amount, date: payment.date, createdAt: nowISO() };
  const entry: Payment = payment.note ? { ...base, note: payment.note } : base;
  const newBalance = BigNumber.maximum(0, new BigNumber(currentBalance).minus(payment.amount)).toNumber();
  return toastAfter(
    db.updateDoc(loanPath(loanId), {
      payments: [...existingPayments, entry],
      currentBalance: newBalance,
      updatedAt: nowISO(),
    }),
    'Afdrag registreret'
  );
}
