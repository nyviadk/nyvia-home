import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import type { ActualLine, BudgetEntry, BudgetEntryInput, PriceChange } from '../types';

const repo = createUserCollectionRepo<BudgetEntry, BudgetEntryInput>({
  collection: 'budgetEntries',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: 'Post oprettet',
});

export const subscribeBudgetEntries = repo.subscribe;
export const createBudgetEntry = repo.create;
export const updateBudgetEntry = repo.update;

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteBudgetEntry = repo.remove;

/** Gem hele faktisk-kortet (ÅÅÅÅ-MM → linjer) for en post. */
export const updateBudgetActuals = (id: string, actuals: Record<string, ActualLine[]>) =>
  repo.patch(id, { actuals }, 'Faktisk gemt');

/** Gem prisændringer ("denne og fremover") for en post. */
export const updateBudgetPriceChanges = (id: string, priceChanges: PriceChange[]) =>
  repo.patch(id, { priceChanges }, 'Prisændring gemt');
