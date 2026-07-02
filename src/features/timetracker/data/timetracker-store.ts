import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { TimeEntry } from '../types';
import { subscribeTimeEntries } from './timetracker.repository';

interface TimetrackerState {
  entries: WithId<TimeEntry>[];
  loading: boolean;
  fromCache: boolean;
}

export const useTimetrackerStore = create<TimetrackerState>()(
  persist(
    () => ({ entries: [], loading: true, fromCache: false }),
    persistOptions<TimetrackerState>('timetracker', ['entries'])
  )
);

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeTimeEntries(
    (snap) =>
      useTimetrackerStore.setState({ entries: snap.docs, loading: false, fromCache: snap.fromCache }),
    () => useTimetrackerStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useTimetrackerStore.setState({ entries: [], loading: true, fromCache: false });
}

hotReloadSubscribe('nyvia.timetracker', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
