import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import { db } from '@/lib/firebase';
import type { ImportBatch } from '../types';

const repo = createUserCollectionRepo<ImportBatch, ImportBatch>({
  collection: 'importBatches',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: null,
});

export const subscribeImportBatches = repo.subscribe;

/** Batchen bærer selv sine tidsstempler fra importen — derfor ikke repo.create. */
export const createImportBatch = (batch: ImportBatch): Promise<string> =>
  db.addDoc<ImportBatch>(repo.collPath(), { ...batch });

export const deleteImportBatch = repo.remove;
