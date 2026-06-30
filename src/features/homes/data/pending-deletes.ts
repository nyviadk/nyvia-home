import { create } from 'zustand';

/** Boliger der er optimistisk slettet (skjult), men endnu ikke skrevet til DB. */
interface PendingDeletesState {
  ids: ReadonlySet<string>;
}

export const usePendingHomeDeletes = create<PendingDeletesState>(() => ({ ids: new Set() }));

export function markPendingHomeDelete(id: string): void {
  usePendingHomeDeletes.setState((s) => ({ ids: new Set(s.ids).add(id) }));
}

export function unmarkPendingHomeDelete(id: string): void {
  usePendingHomeDeletes.setState((s) => {
    const next = new Set(s.ids);
    next.delete(id);
    return { ids: next };
  });
}
