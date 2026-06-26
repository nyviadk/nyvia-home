import { create } from 'zustand';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import type { AnyLoan } from '../types';
import { subscribeLoans } from './loans.repository';

interface LoansState {
  loans: WithId<AnyLoan>[];
  loading: boolean;
  fromCache: boolean;
}

export const useLoansStore = create<LoansState>(() => ({
  loans: [],
  loading: true,
  fromCache: false,
}));

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
// bruger (requireUid er da gyldig), rydder op ved log ud.
auth.onAuthStateChanged((user) => {
  if (user) start();
  else stop();
});
