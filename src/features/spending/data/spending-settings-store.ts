import { create } from 'zustand';

import { auth, type Unsubscribe } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import type { OwnAccount, ScrubRule } from '../types';
import { subscribeSpendingSettings } from './spending-settings.repository';

interface SpendingSettingsState {
  accounts: OwnAccount[];
  scrubRules: ScrubRule[];
  loading: boolean;
}

export const useSpendingSettingsStore = create<SpendingSettingsState>(() => ({
  accounts: [],
  scrubRules: [],
  loading: true,
}));

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeSpendingSettings(
    (doc) =>
      useSpendingSettingsStore.setState({
        accounts: doc?.accounts ?? [],
        scrubRules: doc?.scrubRules ?? [],
        loading: false,
      }),
    () => useSpendingSettingsStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useSpendingSettingsStore.setState({ accounts: [], scrubRules: [], loading: true });
}

hotReloadSubscribe('nyvia.spending-settings', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
