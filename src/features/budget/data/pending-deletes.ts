import { create } from 'zustand';

/** Budgetposter der er optimistisk slettet (skjult), men endnu ikke skrevet til DB. */
interface PendingDeletesState {
  ids: ReadonlySet<string>;
}

export const usePendingBudgetDeletes = create<PendingDeletesState>(() => ({ ids: new Set() }));

export function markPendingBudgetDelete(id: string): void {
  usePendingBudgetDeletes.setState((s) => ({ ids: new Set(s.ids).add(id) }));
}

export function unmarkPendingBudgetDelete(id: string): void {
  usePendingBudgetDeletes.setState((s) => {
    const next = new Set(s.ids);
    next.delete(id);
    return { ids: next };
  });
}
