import type { WithId } from '@/lib/firebase';
import { useTimetrackerStore } from '../data/timetracker-store';
import type { TimeEntry } from '../types';

export function useTimeEntry(id: string): {
  entry: WithId<TimeEntry> | undefined;
  loading: boolean;
} {
  const entry = useTimetrackerStore((s) => s.entries.find((e) => e.id === id));
  const loading = useTimetrackerStore((s) => s.loading);
  return { entry, loading };
}
