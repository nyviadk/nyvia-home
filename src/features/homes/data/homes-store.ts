import { createCollectionStore } from '@/lib/db/collection-store';
import type { Home } from '../types';
import { subscribeHomes } from './homes.repository';

export const useHomesStore = createCollectionStore<Home>('nyvia.homes', subscribeHomes);
