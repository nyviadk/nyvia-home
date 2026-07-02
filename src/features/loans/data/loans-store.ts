import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { AnyLoan } from '../types';
import { subscribeLoans } from './loans.repository';

interface LoansState {
  loans: WithId<AnyLoan>[];
  loading: boolean;
  fromCache: boolean;
}

export const useLoansStore = create<LoansState>()(
  persist(
    () => ({ loans: [], loading: true, fromCache: false }),
    persistOptions<LoansState>('loans', ['loans'])
  )
);

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeLoans(
    (snap) =>
      useLoansStore.setState({ loans: snap.docs, loading: false, fromCache: snap.fromCache }),
    () => useLoansStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useLoansStore.setState({ loans: [], loading: true, fromCache: false });
}

// Listeneren følger login-status (uden komponent-effect). Starter når der er en
// bruger (requireUid er da gyldig), rydder op ved log ud. hotReloadSubscribe sikrer
// at både auth- og loans-listeneren ryddes ved Fast Refresh (ingen leak).
hotReloadSubscribe('nyvia.loans', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
