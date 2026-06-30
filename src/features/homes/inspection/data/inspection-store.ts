import { createCollectionStore } from '@/lib/db/collection-store';
import type { InspectionItem } from '../types';
import { subscribeInspectionItems } from './inspection.repository';

export const useInspectionStore = createCollectionStore<InspectionItem>(
  'nyvia.inspection',
  subscribeInspectionItems
);
