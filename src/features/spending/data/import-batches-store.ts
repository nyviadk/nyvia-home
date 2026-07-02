import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { ImportBatch } from '../types';
import { subscribeImportBatches } from './import-batches.repository';

interface ImportBatchesState {
  batches: WithId<ImportBatch>[];
  loading: boolean;
}

export const useImportBatchesStore = create<ImportBatchesState>()(
  persist(
    () => ({ batches: [], loading: true }),
    persistOptions<ImportBatchesState>('import-batches', ['batches'])
  )
);

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
