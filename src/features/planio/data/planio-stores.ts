import { createCollectionStore } from '@/lib/db/collection-store';
import type { PlanioFalsePositive, PlanioLesson, PlanioRaw } from '../types';
import { subscribeFalsePositives, subscribeLessons, subscribeRaw } from './planio.repository';

/** Live-lektioner (knowledgebase). Persisteres lokalt for instant kold-start. */
export const usePlanioLessonsStore = createCollectionStore<PlanioLesson>('planio-lessons', subscribeLessons);

/** Live rå feedback (arkiv). */
export const usePlanioRawStore = createCollectionStore<PlanioRaw>('planio-raw', subscribeRaw);

/** Live false positives (globalt sæt — injiceres i Pass 1). */
export const usePlanioFalsePositivesStore = createCollectionStore<PlanioFalsePositive>(
  'planio-false-positives',
  subscribeFalsePositives,
);
