import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { BudgetEntry } from '../types';
import { subscribeBudgetEntries } from './budget.repository';

interface BudgetState {
  entries: WithId<BudgetEntry>[];
  loading: boolean;
  fromCache: boolean;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    () => ({ entries: [], loading: true, fromCache: false }),
    persistOptions<BudgetState>('budget', ['entries'])
  )
);

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeBudgetEntries(
    (snap) =>
      useBudgetStore.setState({ entries: snap.docs, loading: false, fromCache: snap.fromCache }),
    () => useBudgetStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useBudgetStore.setState({ entries: [], loading: true, fromCache: false });
}

hotReloadSubscribe('nyvia.budget', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
