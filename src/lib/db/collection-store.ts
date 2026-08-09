import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type CollectionSnapshot, type Unsubscribe, type WithId } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import { createPendingDeletes, withoutPending } from './pending-deletes';

interface CollectionState<T> {
  items: WithId<T>[];
  loading: boolean;
  fromCache: boolean;
}

/**
 * Den del af tilstanden komponenter må vælge frit fra.
 *
 * `items` er BEVIDST ikke med: en rå liste må ikke males, før de optimistisk slettede er
 * filtreret fra. Brug `useVisibleItems()`. Skriver man `(s) => s.items`, er det en
 * compile-fejl — ikke en sletning der spøger på skærmen i syv sekunder.
 */
type SelectableState = { loading: boolean; fromCache: boolean };

/**
 * Standard zustand-store for én Firestore-kollektion: abonnerer mens en bruger er
 * logget ind (genstartes ved hot reload), nulstiller ved logout.
 *
 * Storen ejer også sit eget fortryd-vindue (`pending`). Det var før en separat fil pr.
 * feature, og så skulle HVER liste huske at filtrere — ét glemt sted, og en slettet post
 * blev stående mens fortryd-toasten kørte. Nu er der ét sted at læse listen, og det
 * filtrerer selv.
 */
export function createCollectionStore<T>(
  key: string,
  subscribe: (
    onChange: (snap: CollectionSnapshot<T>) => void,
    onError?: (e: Error) => void
  ) => Unsubscribe,
  /**
   * Navn i persist-laget. Default `col:<key>`. Angives kun af stores der er migreret hertil
   * fra en håndrullet udgave, så deres eksisterende cache ikke invalideres (og brugeren
   * dermed slipper for én langsom kold start).
   */
  persistName = `col:${key}`
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
      persistOptions<CollectionState<T>>(persistName, ['items'])
    )
  );

  const pending = createPendingDeletes();

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

  /** Selector-hook, men uden adgang til `items` — se `SelectableState`. */
  const useSelector = <U,>(selector: (state: SelectableState) => U): U =>
    useStore((s) => selector(s));

  return Object.assign(useSelector, {
    pending,

    /**
     * Posterne som de skal VISES: uden dem der ligger i et fortryd-vindue.
     *
     * ⚠️ Referencen er bevidst STABIL når intet er pending (så `useMemo`-deps ikke bustes
     * hver render) — hvilket betyder at du kan få storens EGEN array tilbage. Skal du
     * `sort()` eller på anden måde mutere, så kopiér først: `[...items].sort(…)`.
     */
    useVisibleItems: (): WithId<T>[] =>
      withoutPending(
        useStore((s) => s.items),
        pending.useStore((s) => s.ids)
      ),

    /**
     * ALLE poster, også dem der venter på at blive slettet. Kun til beregninger hvor det er
     * bevidst — fx dubletkontrol ved import, hvor en post der er på vej ud stadig findes i DB.
     */
    useAllItems: (): WithId<T>[] => useStore((s) => s.items),

    /**
     * Én post fra den allerede abonnerede liste — ingen ekstra listener. `.find` på en stabil
     * array-reference giver en stabil objekt-reference, så selectoren ikke trigger re-render
     * i utide. Filtrerer IKKE pending: detalje-skærmen navigerer selv væk ved sletning.
     *
     * `id` må være undefined (fx en "opret"-skærm der deler komponent med "redigér"), så
     * kaldet ALDRIG skal pakkes i en betingelse — det ville være et betinget hook-kald.
     */
    useItem: (id: string | undefined) => ({
      item: useStore((s) => (id === undefined ? undefined : s.items.find((x) => x.id === id))),
      loading: useStore((s) => s.loading),
    }),

    /** Uden for React (fx i en submit-handler). Ufiltreret. */
    getAllItems: (): WithId<T>[] => useStore.getState().items,
  });
}
