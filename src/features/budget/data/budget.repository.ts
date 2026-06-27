import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { BudgetEntry, BudgetEntryInput } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const entriesPath = () => `users/${requireUid()}/budgetEntries`;
const entryPath = (id: string) => `${entriesPath()}/${id}`;

export function subscribeBudgetEntries(
  onChange: (snap: CollectionSnapshot<BudgetEntry>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<BudgetEntry>(
    entriesPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError
  );
}

export function createBudgetEntry(input: BudgetEntryInput): Promise<string> {
  const now = nowISO();
  return toastAfter(
    db.addDoc<BudgetEntry>(entriesPath(), { ...input, createdAt: now, updatedAt: now }),
    'Post oprettet'
  );
}

export function updateBudgetEntry(id: string, input: BudgetEntryInput): Promise<void> {
  return toastAfter(db.updateDoc(entryPath(id), { ...input, updatedAt: nowISO() }), 'Gemt');
}

/** Sletning toaster ikke her — håndteres af performWithUndo (fortryd). */
export function deleteBudgetEntry(id: string): Promise<void> {
  return db.deleteDoc(entryPath(id));
}

export type { WithId };
