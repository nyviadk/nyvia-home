import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { BankTransaction } from '../types';
import { subscribeTransactions } from './transactions.repository';

interface TransactionsState {
  transactions: WithId<BankTransaction>[];
  loading: boolean;
  fromCache: boolean;
}

// Persisteret som de øvrige data-stores → forbrug males synkront ved kold start (mærkbart
// hurtigere på mobil). Skrive-amplifikationen (persist re-serialiserer hele samlingen ved
// hver ændring) er ufarlig her: CSV-bulkimport er WEB-only, og på native ændres samlingen
// kun via Firestore-sync (sjældne emits). Bliver `forbrug` engang enormt (100k+), er svaret
// paginering af Firestore-queryen — ikke at fjerne persistensen. Se [[mmkv-persistence]].
export const useTransactionsStore = create<TransactionsState>()(
  persist(
    () => ({ transactions: [], loading: true, fromCache: false }),
    persistOptions<TransactionsState>('transactions', ['transactions'])
  )
);

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
