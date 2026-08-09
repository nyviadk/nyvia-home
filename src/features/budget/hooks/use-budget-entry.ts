import type { WithId } from '@/lib/firebase';
import { useBudgetStore } from '../data/budget-store';
import type { BudgetEntry } from '../types';

/** Én budgetpost udledt fra budget-store (ingen separat listener). */
export function useBudgetEntry(id: string): {
  entry: WithId<BudgetEntry> | undefined;
  loading: boolean;
} {
  const { item, loading } = useBudgetStore.useItem(id);
  return { entry: item, loading };
}
