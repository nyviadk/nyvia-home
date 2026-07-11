import { create } from 'zustand';

/** Kunder der er optimistisk slettet (skjult), men endnu ikke skrevet til DB. */
interface PendingDeletesState {
  ids: ReadonlySet<string>;
}

export const useEviPendingDeletes = create<PendingDeletesState>(() => ({ ids: new Set() }));

export function markEviPendingDelete(id: string): void {
  useEviPendingDeletes.setState((s) => ({ ids: new Set(s.ids).add(id) }));
}

export function unmarkEviPendingDelete(id: string): void {
  useEviPendingDeletes.setState((s) => {
    const next = new Set(s.ids);
    next.delete(id);
    return { ids: next };
  });
}
