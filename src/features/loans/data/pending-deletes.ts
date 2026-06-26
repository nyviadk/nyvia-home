import { create } from 'zustand';

/** Lån der er optimistisk slettet (skjult i UI), men endnu ikke skrevet til DB. */
interface PendingDeletesState {
  ids: ReadonlySet<string>;
}

export const usePendingDeletes = create<PendingDeletesState>(() => ({ ids: new Set() }));

export function markPendingDelete(id: string): void {
  usePendingDeletes.setState((s) => ({ ids: new Set(s.ids).add(id) }));
}

export function unmarkPendingDelete(id: string): void {
  usePendingDeletes.setState((s) => {
    const next = new Set(s.ids);
    next.delete(id);
    return { ids: next };
  });
}
