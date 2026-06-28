import { create } from 'zustand';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import type { ImportBatch } from '../types';
import { subscribeImportBatches } from './import-batches.repository';

interface ImportBatchesState {
  batches: WithId<ImportBatch>[];
  loading: boolean;
}

export const useImportBatchesStore = create<ImportBatchesState>(() => ({
  batches: [],
  loading: true,
}));

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeImportBatches(
    (snap) => useImportBatchesStore.setState({ batches: snap.docs, loading: false }),
    () => useImportBatchesStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useImportBatchesStore.setState({ batches: [], loading: true });
}

hotReloadSubscribe('nyvia.import-batches', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
