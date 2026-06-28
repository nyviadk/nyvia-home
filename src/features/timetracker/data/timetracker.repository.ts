import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { TimeEntry, TimeEntryInput } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const entriesPath = () => `users/${requireUid()}/timeEntries`;
const entryPath = (id: string) => `${entriesPath()}/${id}`;

export function subscribeTimeEntries(
  onChange: (snap: CollectionSnapshot<TimeEntry>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<TimeEntry>(
    entriesPath(),
    { orderByField: 'date', orderDirection: 'desc' },
    onChange,
    onError
  );
}

export function createTimeEntry(input: TimeEntryInput): Promise<string> {
  const now = nowISO();
  return toastAfter(
    db.addDoc<TimeEntry>(entriesPath(), { ...input, createdAt: now, updatedAt: now }),
    'Tid registreret'
  );
}

export function updateTimeEntry(id: string, input: TimeEntryInput): Promise<void> {
  return toastAfter(db.updateDoc(entryPath(id), { ...input, updatedAt: nowISO() }), 'Gemt');
}

/** Sletning toaster ikke her — håndteres af performWithUndo (fortryd). */
export function deleteTimeEntry(id: string): Promise<void> {
  return db.deleteDoc(entryPath(id));
}

export type { WithId };
