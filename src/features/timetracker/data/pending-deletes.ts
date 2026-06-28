import { create } from 'zustand';

/** Tids-poster der er optimistisk slettet (skjult), men endnu ikke skrevet til DB. */
interface PendingDeletesState {
  ids: ReadonlySet<string>;
}

export const usePendingTimeDeletes = create<PendingDeletesState>(() => ({ ids: new Set() }));

export function markPendingTimeDelete(id: string): void {
  usePendingTimeDeletes.setState((s) => ({ ids: new Set(s.ids).add(id) }));
}

export function unmarkPendingTimeDelete(id: string): void {
  usePendingTimeDeletes.setState((s) => {
    const next = new Set(s.ids);
    next.delete(id);
    return { ids: next };
  });
}
