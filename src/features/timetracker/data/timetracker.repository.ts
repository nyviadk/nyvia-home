import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import type { TimeEntry, TimeEntryInput } from '../types';

const repo = createUserCollectionRepo<TimeEntry, TimeEntryInput>({
  collection: 'timeEntries',
  orderBy: { field: 'date', direction: 'desc' },
  createdToast: 'Tid registreret',
});

export const subscribeTimeEntries = repo.subscribe;
export const createTimeEntry = repo.create;
export const updateTimeEntry = repo.update;

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteTimeEntry = repo.remove;
