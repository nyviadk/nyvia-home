import { createCollectionStore } from '@/lib/db/collection-store';
import type { TimeEntry } from '../types';
import { subscribeTimeEntries } from './timetracker.repository';

export const useTimetrackerStore = createCollectionStore<TimeEntry>(
  'nyvia.timetracker',
  subscribeTimeEntries,
  'timetracker'
);
