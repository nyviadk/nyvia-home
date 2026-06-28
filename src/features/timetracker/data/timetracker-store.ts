import { create } from 'zustand';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import type { TimeEntry } from '../types';
import { subscribeTimeEntries } from './timetracker.repository';

interface TimetrackerState {
  entries: WithId<TimeEntry>[];
  loading: boolean;
  fromCache: boolean;
}

export const useTimetrackerStore = create<TimetrackerState>(() => ({
  entries: [],
  loading: true,
  fromCache: false,
}));

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
