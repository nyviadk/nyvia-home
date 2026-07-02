import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type CollectionSnapshot, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';

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
  // persist: cachede `items` males synkront ved kold start (MMKV/localStorage), før Firestore
  // -listeneren svarer. `loading`/`fromCache` gemmes ikke — de nulstilles og opdateres live.
  const useStore = create<CollectionState<T>>()(
    persist(
      () => ({
        items: [] as WithId<T>[],
        loading: true,
        fromCache: false,
      }),
      persistOptions<CollectionState<T>>(`col:${key}`, ['items'])
    )
  );

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
