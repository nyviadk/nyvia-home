import { createCollectionStore } from '@/lib/db/collection-store';
import type { ImportBatch } from '../types';
import { subscribeImportBatches } from './import-batches.repository';

export const useImportBatchesStore = createCollectionStore<ImportBatch>(
  'nyvia.import-batches',
  subscribeImportBatches,
  'import-batches'
);
