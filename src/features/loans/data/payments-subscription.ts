import type { Unsubscribe, WithId } from '@/lib/firebase';
import type { Payment } from '../types';
import { subscribePayments } from './loans.repository';

/**
 * Ref-tællt registry over afdrags-listeners pr. lån, beregnet til useSyncExternalStore.
 * Én Firestore-listener pr. loanId, delt mellem abonnenter; lukkes når den sidste forlader.
 */
const EMPTY: WithId<Payment>[] = [];
const cache = new Map<string, WithId<Payment>[]>();
const listeners = new Map<string, Set<() => void>>();
const unsubs = new Map<string, Unsubscribe>();

export function subscribeToPayments(loanId: string, onStoreChange: () => void): () => void {
  let set = listeners.get(loanId);
  if (!set) {
    set = new Set();
    listeners.set(loanId, set);
  }
  set.add(onStoreChange);

  if (!unsubs.has(loanId)) {
    unsubs.set(
      loanId,
      subscribePayments(loanId, (snap) => {
        cache.set(loanId, snap.docs);
        listeners.get(loanId)?.forEach((notify) => notify());
      })
    );
  }

  return () => {
    const current = listeners.get(loanId);
    current?.delete(onStoreChange);
    if (current && current.size === 0) {
      unsubs.get(loanId)?.();
      unsubs.delete(loanId);
      listeners.delete(loanId);
      cache.delete(loanId);
    }
  };
}

export function getPaymentsSnapshot(loanId: string): WithId<Payment>[] {
  return cache.get(loanId) ?? EMPTY;
}
