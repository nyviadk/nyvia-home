import BigNumber from 'bignumber.js';

import { nowISO } from '@/lib/datetime';
import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import { db } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
import type { CustomLoan } from '../custom/types';
import type { AnyLoan, LoanInput, Payment } from '../types';

/** Custom-lån uden afledte/tidsstempel-felter (det brugeren redigerer). */
export type CustomLoanInput = Omit<CustomLoan, 'createdAt' | 'updatedAt'>;

// Kollektionen rummer bevidst to dokument-former (standard + custom), derfor union'en.
// `LoanInput` uden `type` er update-formen; med `type: 'standard'` er det create-formen.
const repo = createUserCollectionRepo<
  AnyLoan,
  LoanInput | (LoanInput & { type: 'standard' }) | CustomLoanInput
>({
  collection: 'loans',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: 'Lån oprettet',
});

export const subscribeLoans = repo.subscribe;

export const createLoan = (input: LoanInput) => repo.create({ ...input, type: 'standard' });
export const updateLoan = (id: string, input: LoanInput) => repo.update(id, input);

export const createCustomLoan = (input: CustomLoanInput) => repo.create(input);
export const updateCustomLoan = (id: string, input: CustomLoanInput) => repo.update(id, input);

/** Gem kun de faktiske afdrag (faktisk-vs-forventet). */
export const updateCustomActuals = (id: string, actuals: Record<string, number>) =>
  repo.patch(id, { actuals }, 'Faktisk afdrag gemt');

/** Gem kun posterne (bruges af medtag/fravælg-filteret i oversigten). */
export const updateCustomLineItems = (id: string, lineItems: CustomLoan['lineItems']) =>
  repo.patch(id, { lineItems }, 'Poster opdateret');

/** Gem kun afbetalings-horisonten (vælges dynamisk i afbetalingsplanen). */
export const updateCustomHorizon = (id: string, horizon: CustomLoan['horizon']) =>
  repo.patch(id, { horizon }, 'Tidshorisont opdateret');

/** Gem kun buffer (vælges i afbetalingsplanen, kun relevant ved 'asap'). */
export const updateCustomBuffer = (id: string, buffer: CustomLoan['buffer']) =>
  repo.patch(id, { buffer }, 'Buffer opdateret');

/** Gem kun én udgiftstabel (ny/nuværende bolig) — inline-redigering i oversigten. */
export const updateCustomExpenseTable = (
  id: string,
  key: 'newHome' | 'oldHome',
  table: CustomLoan['newHome']
) => repo.patch(id, { [key]: table }, 'Udgifter gemt');

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteLoan = repo.remove;

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
    db.updateDoc(repo.docPath(loanId), {
      payments: [...existingPayments, entry],
      currentBalance: newBalance,
      updatedAt: nowISO(),
    }),
    'Afdrag registreret'
  );
}
