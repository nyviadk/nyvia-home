import type { WithId } from '@/lib/firebase';
import { useBudgetStore } from '../data/budget-store';
import type { BudgetEntry } from '../types';

export function useBudgetEntry(id: string): {
  entry: WithId<BudgetEntry> | undefined;
  loading: boolean;
} {
  const entry = useBudgetStore((s) => s.entries.find((e) => e.id === id));
  const loading = useBudgetStore((s) => s.loading);
  return { entry, loading };
}
