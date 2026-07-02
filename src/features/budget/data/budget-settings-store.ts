import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { SavingsPercentChange } from '../types';
import { subscribeBudgetSettings } from './budget-settings.repository';

interface BudgetSettingsState {
  /** ÅÅÅÅ-MM-DD, eller null hvis aldrig sat. */
  startDate: string | null;
  /** Automatisk opsparing i grund-procent (0 hvis ikke sat). */
  savingsPercent: number;
  /** Fremadrettede ændringer af opsparingsprocenten. */
  savingsPercentChanges: SavingsPercentChange[];
  /** Faktisk opsparing pr. måned (ÅÅÅÅ-MM → øre). */
  savingsActuals: Record<string, number>;
  loading: boolean;
}

export const useBudgetSettingsStore = create<BudgetSettingsState>()(
  persist(
    () => ({
      startDate: null,
      savingsPercent: 0,
      savingsPercentChanges: [],
      savingsActuals: {},
      loading: true,
    }),
    persistOptions<BudgetSettingsState>('budget-settings', [
      'startDate',
      'savingsPercent',
      'savingsPercentChanges',
      'savingsActuals',
    ])
  )
);

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeBudgetSettings(
    (doc) =>
      useBudgetSettingsStore.setState({
        startDate: doc?.startDate ?? null,
        savingsPercent: doc?.savingsPercent ?? 0,
        savingsPercentChanges: doc?.savingsPercentChanges ?? [],
        savingsActuals: doc?.savingsActuals ?? {},
        loading: false,
      }),
    () => useBudgetSettingsStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useBudgetSettingsStore.setState({
    startDate: null,
    savingsPercent: 0,
    savingsPercentChanges: [],
    savingsActuals: {},
    loading: true,
  });
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
