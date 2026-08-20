import { createCollectionStore } from '@/lib/db/collection-store';
import { createDocStore } from '@/lib/db/doc-store';
import type { WithId } from '@/lib/firebase';
import { DEFAULT_SETTINGS, type ProteinFood, type ProteinLogEntry, type ProteinSettings } from '../types';
import { subscribeFoods, subscribeLog, subscribeProteinSettings } from './protein.repository';

export const useFoodsStore = createCollectionStore<ProteinFood>('nyvia.protein-foods', subscribeFoods);

export const useLogStore = createCollectionStore<ProteinLogEntry>('nyvia.protein-log', subscribeLog);

/**
 * Målene. `empty` er ikke nuller men de faktiske standardværdier: har man aldrig åbnet
 * indstillingerne, skal appen stadig regne rigtigt fra første tryk — et mål på 0 ville gøre
 * hver eneste procentsats til uendelig.
 */
export const useProteinSettingsStore = createDocStore<
  WithId<ProteinSettings>,
  Omit<ProteinSettings, 'updatedAt'>
>({
  key: 'nyvia.protein-settings',
  persistName: 'protein-settings',
  subscribe: subscribeProteinSettings,
  empty: { ...DEFAULT_SETTINGS },
  map: (doc) => ({
    proteinGoalG: doc.proteinGoalG ?? DEFAULT_SETTINGS.proteinGoalG,
    kcalGoalKcal: doc.kcalGoalKcal ?? DEFAULT_SETTINGS.kcalGoalKcal,
    unknownProteinG: doc.unknownProteinG ?? DEFAULT_SETTINGS.unknownProteinG,
    unknownKcal: doc.unknownKcal ?? DEFAULT_SETTINGS.unknownKcal,
  }),
});
