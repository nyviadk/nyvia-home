import { create } from 'zustand';

import { auth, type Unsubscribe } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { subscribeTimetrackerSettings } from './timetracker-settings.repository';

interface TimetrackerSettingsState {
  /** ÅÅÅÅ-MM-DD eller null hvis ikke sat. */
  officialStartDate: string | null;
  loading: boolean;
}

export const useTimetrackerSettingsStore = create<TimetrackerSettingsState>(() => ({
  officialStartDate: null,
  loading: true,
}));

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeTimetrackerSettings(
    (doc) =>
      useTimetrackerSettingsStore.setState({
        officialStartDate: doc?.officialStartDate ?? null,
        loading: false,
      }),
    () => useTimetrackerSettingsStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useTimetrackerSettingsStore.setState({ officialStartDate: null, loading: true });
}

hotReloadSubscribe('nyvia.timetracker-settings', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
