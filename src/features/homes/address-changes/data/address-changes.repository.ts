import { nowISO } from '@/lib/datetime';
import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import { type BatchOp, db } from '@/lib/firebase';
import { genId } from '@/lib/id';
import type { AddressChange, AddressChangeInput, AddressChangeStatus } from '../types';

const repo = createUserCollectionRepo<AddressChange, AddressChangeInput>({
  collection: 'addressChanges',
  orderBy: { field: 'createdAt', direction: 'asc' },
  createdToast: null,
});

export const subscribeAddressChanges = repo.subscribe;
export const createAddressChange = repo.create;

export const setAddressChangeStatus = (id: string, status: AddressChangeStatus) =>
  repo.patch(id, { status }, null);

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteAddressChange = repo.remove;

export async function createAddressChanges(inputs: AddressChangeInput[]): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = inputs.map((input) => ({
    type: 'set',
    path: `${repo.collPath()}/${genId()}`,
    data: { ...input, createdAt: now, updatedAt: now },
  }));
  await db.commitBatch(ops);
}

/** Sæt status på mange ændringer i ét kald. Bruges af nulstil + dens fortryd. */
export function setAddressChangeStatuses(
  entries: { id: string; status: AddressChangeStatus }[]
): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = entries.map(({ id, status }) => ({
    type: 'update',
    path: repo.docPath(id),
    data: { status, updatedAt: now },
  }));
  return db.commitBatch(ops);
}
