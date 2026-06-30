import { createCollectionStore } from '@/lib/db/collection-store';
import type { MoveTask } from '../types';
import { subscribeMoveTasks } from './move-tasks.repository';

export const useMoveTasksStore = createCollectionStore<MoveTask>(
  'nyvia.move-tasks',
  subscribeMoveTasks
);
