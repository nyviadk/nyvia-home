import { createCollectionStore } from '@/lib/db/collection-store';
import type { SpanishEntry } from '../types';
import { subscribeSpanishEntries } from './spanish.repository';

export const useSpanishStore = createCollectionStore<SpanishEntry>(
  'nyvia.spanish',
  subscribeSpanishEntries
);
