import { createDocStore } from '@/lib/db/doc-store';
import type { WithId } from '@/lib/firebase';
import type { BudgetSettings, SavingsPercentChange } from '../types';
import { subscribeBudgetSettings } from './budget-settings.repository';

interface BudgetSettingsData {
  /** ÅÅÅÅ-MM-DD, eller null hvis aldrig sat. */
  startDate: string | null;
  /** Automatisk opsparing i grund-procent (0 hvis ikke sat). */
  savingsPercent: number;
  /** Fremadrettede ændringer af opsparingsprocenten. */
  savingsPercentChanges: SavingsPercentChange[];
  /** Faktisk opsparing pr. måned (ÅÅÅÅ-MM → øre). */
  savingsActuals: Record<string, number>;
}

export const useBudgetSettingsStore = createDocStore<WithId<BudgetSettings>, BudgetSettingsData>({
  key: 'nyvia.budget-settings',
  persistName: 'budget-settings',
  subscribe: subscribeBudgetSettings,
  empty: { startDate: null, savingsPercent: 0, savingsPercentChanges: [], savingsActuals: {} },
  map: (doc) => ({
    startDate: doc.startDate ?? null,
    savingsPercent: doc.savingsPercent ?? 0,
    savingsPercentChanges: doc.savingsPercentChanges ?? [],
    savingsActuals: doc.savingsActuals ?? {},
  }),
});
