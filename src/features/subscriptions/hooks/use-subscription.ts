import type { WithId } from '@/lib/firebase';
import { useSubscriptionsStore } from '../data/subscriptions-store';
import type { Subscription } from '../types';

/** Ét abonnement udledt fra subscriptions-store (ingen separat listener). */
export function useSubscription(id: string): {
  subscription: WithId<Subscription> | undefined;
  loading: boolean;
} {
  const { item, loading } = useSubscriptionsStore.useItem(id);
  return { subscription: item, loading };
}
