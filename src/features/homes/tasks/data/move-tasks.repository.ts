import { nowISO } from '@/lib/datetime';
import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import { type BatchOp, db } from '@/lib/firebase';
import { genId } from '@/lib/id';
import type { MoveTask, MoveTaskInput } from '../types';

const repo = createUserCollectionRepo<MoveTask, MoveTaskInput>({
  collection: 'moveTasks',
  orderBy: { field: 'order', direction: 'asc' },
  createdToast: null,
});

export const subscribeMoveTasks = repo.subscribe;
export const createMoveTask = repo.create;
export const setMoveTaskDone = (id: string, done: boolean) => repo.patch(id, { done }, null);

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteMoveTask = repo.remove;

/** Opretter flere opgaver (fx standard-listen) i én batch. */
export async function createMoveTasks(inputs: MoveTaskInput[]): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = inputs.map((input) => ({
    type: 'set',
    path: `${repo.collPath()}/${genId()}`,
    data: { ...input, createdAt: now, updatedAt: now },
  }));
  await db.commitBatch(ops);
}

/** Sæt `done` på mange opgaver i ét kald. Bruges af nulstil + dens fortryd. */
export function setMoveTasksDone(entries: { id: string; done: boolean }[]): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = entries.map(({ id, done }) => ({
    type: 'update',
    path: repo.docPath(id),
    data: { done, updatedAt: now },
  }));
  return db.commitBatch(ops);
}
