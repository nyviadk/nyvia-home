import { create } from 'zustand';

import { auth, type CollectionSnapshot, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';

export interface CollectionState<T> {
  items: WithId<T>[];
  loading: boolean;
  fromCache: boolean;
}

/**
 * Standard zustand-store for én Firestore-kollektion: abonnerer mens en bruger er
 * logget ind (genstartes ved hot reload), nulstiller ved logout. Erstatter den
 * gentagne start/stop-boilerplate, så hver store bliver en one-liner.
 */
export function createCollectionStore<T>(
  key: string,
  subscribe: (
    onChange: (snap: CollectionSnapshot<T>) => void,
    onError?: (e: Error) => void
  ) => Unsubscribe
) {
  const useStore = create<CollectionState<T>>(() => ({
    items: [],
    loading: true,
    fromCache: false,
  }));

  let unsubscribe: Unsubscribe | null = null;

  const start = () => {
    if (unsubscribe) return;
    unsubscribe = subscribe(
      (snap) => useStore.setState({ items: snap.docs, loading: false, fromCache: snap.fromCache }),
      () => useStore.setState({ loading: false })
    );
  };
  const stop = () => {
    unsubscribe?.();
    unsubscribe = null;
    useStore.setState({ items: [], loading: true, fromCache: false });
  };

  hotReloadSubscribe(key, () => {
    const unsubAuth = auth.onAuthStateChanged((user) => (user ? start() : stop()));
    return () => {
      unsubAuth();
      stop();
    };
  });

  return useStore;
}
