import { createCollectionStore } from '@/lib/db/collection-store';
import type { BudgetEntry } from '../types';
import { subscribeBudgetEntries } from './budget.repository';

export const useBudgetStore = createCollectionStore<BudgetEntry>(
  'nyvia.budget',
  subscribeBudgetEntries,
  'budget'
);
