import { createDocStore } from '@/lib/db/doc-store';
import type { WithId } from '@/lib/firebase';
import type { TimetrackerSettings } from '../types';
import { subscribeTimetrackerSettings } from './timetracker-settings.repository';

export const useTimetrackerSettingsStore = createDocStore<
  WithId<TimetrackerSettings>,
  { officialStartDate: string | null }
>({
  key: 'nyvia.timetracker-settings',
  persistName: 'timetracker-settings',
  subscribe: subscribeTimetrackerSettings,
  empty: { officialStartDate: null },
  map: (doc) => ({ officialStartDate: doc.officialStartDate ?? null }),
});
