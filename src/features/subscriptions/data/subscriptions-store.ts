import { create } from 'zustand';

import { auth, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import type { Subscription } from '../types';
import { subscribeSubscriptions } from './subscriptions.repository';

interface SubscriptionsState {
  subscriptions: WithId<Subscription>[];
  loading: boolean;
  fromCache: boolean;
}

export const useSubscriptionsStore = create<SubscriptionsState>(() => ({
  subscriptions: [],
  loading: true,
  fromCache: false,
}));

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
