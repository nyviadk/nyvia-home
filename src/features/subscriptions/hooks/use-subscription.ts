import type { WithId } from '@/lib/firebase';
import { useSubscriptionsStore } from '../data/subscriptions-store';
import type { Subscription } from '../types';

export function useSubscription(id: string): {
  subscription: WithId<Subscription> | undefined;
  loading: boolean;
} {
  const subscription = useSubscriptionsStore((s) => s.subscriptions.find((x) => x.id === id));
  const loading = useSubscriptionsStore((s) => s.loading);
  return { subscription, loading };
}
