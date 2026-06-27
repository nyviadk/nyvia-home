import { create } from 'zustand';

import { auth, type Unsubscribe } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { subscribeBudgetSettings } from './budget-settings.repository';

interface BudgetSettingsState {
  /** ÅÅÅÅ-MM-DD, eller null hvis aldrig sat. */
  startDate: string | null;
  loading: boolean;
}

export const useBudgetSettingsStore = create<BudgetSettingsState>(() => ({
  startDate: null,
  loading: true,
}));

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeBudgetSettings(
    (doc) => useBudgetSettingsStore.setState({ startDate: doc?.startDate ?? null, loading: false }),
    () => useBudgetSettingsStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useBudgetSettingsStore.setState({ startDate: null, loading: true });
}

hotReloadSubscribe('nyvia.budget-settings', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
