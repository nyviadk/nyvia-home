import { nowISO } from '@/lib/datetime';
import { auth, type BatchOp, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
import type { MoveTask, MoveTaskInput } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const collPath = () => `users/${requireUid()}/moveTasks`;
const docPath = (id: string) => `${collPath()}/${id}`;

export function subscribeMoveTasks(
  onChange: (snap: CollectionSnapshot<MoveTask>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<MoveTask>(
    collPath(),
    { orderByField: 'order', orderDirection: 'asc' },
    onChange,
    onError
  );
}

export function createMoveTask(input: MoveTaskInput): Promise<string> {
  const now = nowISO();
  return db.addDoc<MoveTask>(collPath(), { ...input, createdAt: now, updatedAt: now });
}

/** Opretter flere opgaver (fx standard-listen) i én batch. */
export async function createMoveTasks(inputs: MoveTaskInput[]): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = inputs.map((input) => ({
    type: 'set',
    path: `${collPath()}/${genId()}`,
    data: { ...input, createdAt: now, updatedAt: now },
  }));
  await db.commitBatch(ops);
}

export function setMoveTaskDone(id: string, done: boolean): Promise<void> {
  return db.updateDoc(docPath(id), { done, updatedAt: nowISO() });
}

/** Nulstil alle (eller de angivne) opgaver til ikke-klaret — klar til næste flytning. */
export function resetMoveTasks(ids: string[]): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = ids.map((id) => ({
    type: 'update',
    path: docPath(id),
    data: { done: false, updatedAt: now },
  }));
  return toastAfter(db.commitBatch(ops), 'Nulstillet');
}

export function deleteMoveTask(id: string): Promise<void> {
  return toastAfter(db.deleteDoc(docPath(id)), 'Opgave slettet');
}
