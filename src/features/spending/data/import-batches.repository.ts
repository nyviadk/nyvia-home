import { auth, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import type { ImportBatch } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const collPath = () => `users/${requireUid()}/importBatches`;
const docPath = (id: string) => `${collPath()}/${id}`;

export function subscribeImportBatches(
  onChange: (snap: CollectionSnapshot<ImportBatch>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<ImportBatch>(
    collPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError
  );
}

export function createImportBatch(batch: ImportBatch): Promise<string> {
  return db.addDoc<ImportBatch>(collPath(), { ...batch });
}

export function deleteImportBatch(id: string): Promise<void> {
  return db.deleteDoc(docPath(id));
}
