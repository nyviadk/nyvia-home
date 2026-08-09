import { createDocStore } from '@/lib/db/doc-store';
import type { WithId } from '@/lib/firebase';
import type { OwnAccount, ScrubRule, SpendingSettings } from '../types';
import { subscribeSpendingSettings } from './spending-settings.repository';

interface SpendingSettingsData {
  accounts: OwnAccount[];
  scrubRules: ScrubRule[];
}

export const useSpendingSettingsStore = createDocStore<
  WithId<SpendingSettings>,
  SpendingSettingsData
>({
  key: 'nyvia.spending-settings',
  persistName: 'spending-settings',
  subscribe: subscribeSpendingSettings,
  empty: { accounts: [], scrubRules: [] },
  map: (doc) => ({ accounts: doc.accounts ?? [], scrubRules: doc.scrubRules ?? [] }),
});
