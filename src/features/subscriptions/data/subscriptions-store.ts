import { createCollectionStore } from '@/lib/db/collection-store';
import type { Subscription } from '../types';
import { subscribeSubscriptions } from './subscriptions.repository';

export const useSubscriptionsStore = createCollectionStore<Subscription>(
  'nyvia.subscriptions',
  subscribeSubscriptions,
  'subscriptions'
);
