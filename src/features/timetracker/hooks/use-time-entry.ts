import type { WithId } from '@/lib/firebase';
import { useTimetrackerStore } from '../data/timetracker-store';
import type { TimeEntry } from '../types';

/** Én tids-post udledt fra timetracker-store (ingen separat listener). */
export function useTimeEntry(id: string): {
  entry: WithId<TimeEntry> | undefined;
  loading: boolean;
} {
  const { item, loading } = useTimetrackerStore.useItem(id);
  return { entry: item, loading };
}
