import { nowISO } from '@/lib/datetime';
import { auth, type BatchOp, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
import type { AddressChange, AddressChangeInput, AddressChangeStatus } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const collPath = () => `users/${requireUid()}/addressChanges`;
const docPath = (id: string) => `${collPath()}/${id}`;

export function subscribeAddressChanges(
  onChange: (snap: CollectionSnapshot<AddressChange>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<AddressChange>(
    collPath(),
    { orderByField: 'createdAt', orderDirection: 'asc' },
    onChange,
    onError
  );
}

export function createAddressChange(input: AddressChangeInput): Promise<string> {
  const now = nowISO();
  return db.addDoc<AddressChange>(collPath(), { ...input, createdAt: now, updatedAt: now });
}

export async function createAddressChanges(inputs: AddressChangeInput[]): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = inputs.map((input) => ({
    type: 'set',
    path: `${collPath()}/${genId()}`,
    data: { ...input, createdAt: now, updatedAt: now },
  }));
  await db.commitBatch(ops);
}

export function setAddressChangeStatus(id: string, status: AddressChangeStatus): Promise<void> {
  return db.updateDoc(docPath(id), { status, updatedAt: nowISO() });
}

/** Nulstil alle (eller de angivne) til "ikke startet" — klar til næste flytning. */
export function resetAddressChangeStatuses(ids: string[]): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = ids.map((id) => ({
    type: 'update',
    path: docPath(id),
    data: { status: 'ikke_startet', updatedAt: now },
  }));
  return toastAfter(db.commitBatch(ops), 'Nulstillet');
}

export function deleteAddressChange(id: string): Promise<void> {
  return toastAfter(db.deleteDoc(docPath(id)), 'Slettet');
}
