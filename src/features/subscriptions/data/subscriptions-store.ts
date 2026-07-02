import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { Subscription } from '../types';
import { subscribeSubscriptions } from './subscriptions.repository';

interface SubscriptionsState {
  subscriptions: WithId<Subscription>[];
  loading: boolean;
  fromCache: boolean;
}

export const useSubscriptionsStore = create<SubscriptionsState>()(
  persist(
    () => ({ subscriptions: [], loading: true, fromCache: false }),
    persistOptions<SubscriptionsState>('subscriptions', ['subscriptions'])
  )
);

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeSubscriptions(
    (snap) =>
      useSubscriptionsStore.setState({
        subscriptions: snap.docs,
        loading: false,
        fromCache: snap.fromCache,
      }),
    () => useSubscriptionsStore.setState({ loading: false })
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useSubscriptionsStore.setState({ subscriptions: [], loading: true, fromCache: false });
}

hotReloadSubscribe('nyvia.subscriptions', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (user) start();
    else stop();
  });
  return () => {
    unsubAuth();
    stop();
  };
});
