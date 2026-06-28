import { create } from 'zustand';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import type { BankTransaction } from '../types';
import { subscribeTransactions } from './transactions.repository';

interface TransactionsState {
  transactions: WithId<BankTransaction>[];
  loading: boolean;
  fromCache: boolean;
}

export const useTransactionsStore = create<TransactionsState>(() => ({
  transactions: [],
  loading: true,
  fromCache: false,
}));

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeTransactions(
    (snap) =>
      useTransactionsStore.setState({
        transactions: snap.docs,
        loading: false,
        fromCache: snap.fromCache,
      }),
    () => useTransactionsStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useTransactionsStore.setState({ transactions: [], loading: true, fromCache: false });
}

hotReloadSubscribe('nyvia.transactions', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
