import { create } from 'zustand';

/** Abonnementer der er optimistisk slettet (skjult), men endnu ikke skrevet til DB. */
interface PendingDeletesState {
  ids: ReadonlySet<string>;
}

export const usePendingSubscriptionDeletes = create<PendingDeletesState>(() => ({ ids: new Set() }));

export function markPendingSubscriptionDelete(id: string): void {
  usePendingSubscriptionDeletes.setState((s) => ({ ids: new Set(s.ids).add(id) }));
}

export function unmarkPendingSubscriptionDelete(id: string): void {
  usePendingSubscriptionDeletes.setState((s) => {
    const next = new Set(s.ids);
    next.delete(id);
    return { ids: next };
  });
}
