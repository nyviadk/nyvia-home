import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';

/**
 * Samme som `createCollectionStore`, men for ÉT Firestore-dokument (indstillinger, skabelon).
 * Abonnerer mens en bruger er logget ind, nulstiller ved logout, og persisterer de mappede
 * felter så de males synkront ved kold start.
 *
 * `empty` er både start-tilstanden og det der nulstilles til; dens nøgler er også dem der
 * persisteres. `map` oversætter dokumentet til de felter komponenterne læser.
 */
export function createDocStore<Doc, Data extends object>(opts: {
  /** Nøgle til hot-reload-singletonen, fx 'nyvia.spending-settings'. */
  key: string;
  /** Navn i persist-laget, fx 'spending-settings' (bliver til `nyvia:spending-settings`). */
  persistName: string;
  subscribe: (
    onChange: (doc: Doc | null) => void,
    onError?: (e: Error) => void
  ) => Unsubscribe;
  empty: Data;
  map: (doc: Doc) => Data;
}) {
  /**
   * `exists` skelner "dokumentet findes ikke" fra "dokumentet er tomt".
   *
   * `map`/`empty` slår ellers de to sammen, og så må den der spørger gætte ud fra et felt
   * — fx "har personen et navn?". Det gæt er forkert i det halve sekund før dokumentet er
   * hentet, og en importrutine der bruger det, kan nå at skrive hen over rigtige data.
   * Hverken `loading` eller `exists` persisteres; kun `empty`s nøgler gør.
   */
  type State = Data & { loading: boolean; exists: boolean };

  const useStore = create<State>()(
    persist(
      () => ({ ...opts.empty, loading: true, exists: false }),
      persistOptions<State>(opts.persistName, Object.keys(opts.empty) as (keyof State)[])
    )
  );

  let unsubscribe: Unsubscribe | null = null;

  const start = () => {
    if (unsubscribe) return;
    unsubscribe = opts.subscribe(
      (doc) =>
        useStore.setState({
          ...(doc ? opts.map(doc) : opts.empty),
          loading: false,
          exists: !!doc,
        }),
      () => useStore.setState({ loading: false } as Partial<State>)
    );
  };
  const stop = () => {
    unsubscribe?.();
    unsubscribe = null;
    useStore.setState({ ...opts.empty, loading: true, exists: false });
  };

  hotReloadSubscribe(opts.key, () => {
    const unsubAuth = auth.onAuthStateChanged((user) => (user ? start() : stop()));
    return () => {
      unsubAuth();
      stop();
    };
  });

  return useStore;
}
