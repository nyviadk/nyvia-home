/**
 * Den platform-uafhængige HALVDEL af Firebase-klienten.
 *
 * Web (`firebase`) og native (`@react-native-firebase`) har samme modulære API-form, så al
 * ikke-triviel logik — snapshot-mapping, de to dedup-mekanismer og batch-chunking — kan bo ét
 * sted. `client.web.ts` og `client.native.ts` reducerer sig dermed til at wire deres SDK op.
 * Før lå de ~110 linjer duplikeret i begge filer, med enslydende kommentarer og den
 * åbenlyse risiko at en rettelse kun blev lavet det ene sted.
 *
 * Ingen `any`: SDK'ernes ref/query-typer er opake type-parametre (`Q`, `R`), og deres
 * snapshots beskrives strukturelt af `RawQuerySnapshot`/`RawDocSnapshot` — begge SDK'ers
 * rigtige snapshot-typer opfylder dem uden cast.
 */
import type {
  AuthFacade,
  AuthUser,
  BatchOp,
  CollectionSnapshot,
  DbFacade,
  Unsubscribe,
  WithId,
} from './facade';

/** Den delmængde af et query-snapshot vi bruger. Opfyldes af begge SDK'er. */
export interface RawQuerySnapshot {
  docs: readonly { id: string; data(): unknown }[];
  docChanges(): readonly unknown[];
  metadata: { fromCache: boolean };
}

/** Den delmængde af et dokument-snapshot vi bruger. Opfyldes af begge SDK'er. */
export interface RawDocSnapshot {
  id: string;
  exists(): boolean;
  data(): unknown;
}

/** Den delmængde af en WriteBatch vi bruger. */
export interface RawBatch<R> {
  set(ref: R, data: Record<string, unknown>, options: { merge: boolean }): unknown;
  update(ref: R, data: Record<string, unknown>): unknown;
  delete(ref: R): unknown;
  commit(): Promise<void>;
}

/**
 * Det platform-laget skal levere. `Q` er SDK'ets query/collection-reference, `R` dets
 * dokument-reference — begge forbliver opake her.
 */
export interface FirestoreApi<Q, R> {
  /** Kollektionen som query, evt. sorteret. Sti-baseret, så SDK'ets CollectionReference-type
   *  aldrig lækker ud i `Q` (den ville ellers kollidere med den bredere Query-type). */
  queryRef(path: string, order?: { field: string; direction: 'asc' | 'desc' }): Q;
  docRef(path: string): R;
  onQuerySnapshot(
    query: Q,
    onNext: (snap: RawQuerySnapshot) => void,
    onError: (error: Error) => void
  ): Unsubscribe;
  onDocSnapshot(
    ref: R,
    onNext: (snap: RawDocSnapshot) => void,
    onError: (error: Error) => void
  ): Unsubscribe;
  getDocOnce(ref: R): Promise<RawDocSnapshot>;
  addDocument(collectionPath: string, data: Record<string, unknown>): Promise<{ id: string }>;
  setDocument(ref: R, data: Record<string, unknown>, merge: boolean): Promise<void>;
  updateDocument(ref: R, data: Record<string, unknown>): Promise<void>;
  deleteDocument(ref: R): Promise<void>;
  newBatch(): RawBatch<R>;
}

const toWithId = <T,>(snap: { id: string; data(): unknown }): WithId<T> =>
  ({ id: snap.id, ...(snap.data() as Record<string, unknown>) }) as WithId<T>;

export function createDb<Q, R>(api: FirestoreApi<Q, R>): DbFacade {
  return {
    subscribeCollection: <T,>(
      path: string,
      options: { orderByField?: string; orderDirection?: 'asc' | 'desc' },
      onChange: (snapshot: CollectionSnapshot<T>) => void,
      onError?: (error: Error) => void
    ) => {
      const query = api.queryRef(
        path,
        options.orderByField
          ? { field: options.orderByField, direction: options.orderDirection ?? 'asc' }
          : undefined
      );
      // Ved metadata-kun-emits (fx cache→server med SAMME data) genbruger vi forrige docs-
      // reference, så stores ikke overskriver items med et nyt array → ingen unødig re-render
      // eller forecast-genberegning. docChanges().length === 0 = intet dokument ændret siden sidst.
      let prevDocs: WithId<T>[] | null = null;
      return api.onQuerySnapshot(
        query,
        (snap) => {
          const docs =
            prevDocs !== null && snap.docChanges().length === 0
              ? prevDocs
              : snap.docs.map((d) => toWithId<T>(d));
          prevDocs = docs;
          onChange({ docs, fromCache: snap.metadata.fromCache });
        },
        (err) => onError?.(err)
      );
    },

    subscribeDoc: <T,>(
      path: string,
      onChange: (doc: WithId<T> | null) => void,
      onError?: (error: Error) => void
    ) => {
      // Spring uændrede emits over (fx cache→server-flip med samme data). subscribeDoc giver ikke
      // fromCache videre, så der er intet at opdatere når data er ens → undgå at stores re-kører
      // setState og laver nye array-/objekt-referencer (fx savingsPercentChanges) unødigt.
      let prevKey: string | null = null;
      return api.onDocSnapshot(
        api.docRef(path),
        (snap) => {
          const data = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
          const key = data ? `${snap.id}|${JSON.stringify(data)}` : 'null';
          if (key === prevKey) return;
          prevKey = key;
          onChange(data ? ({ id: snap.id, ...data } as WithId<T>) : null);
        },
        (err) => onError?.(err)
      );
    },

    getDoc: async <T,>(path: string): Promise<WithId<T> | null> => {
      const snap = await api.getDocOnce(api.docRef(path));
      return snap.exists() ? toWithId<T>(snap) : null;
    },

    addDoc: async (collectionPath, data) => (await api.addDocument(collectionPath, data)).id,

    setDoc: (docPath, data, merge = false) => api.setDocument(api.docRef(docPath), data, merge),

    updateDoc: (docPath, data) => api.updateDocument(api.docRef(docPath), data),

    deleteDoc: (docPath) => api.deleteDocument(api.docRef(docPath)),

    commitBatch: async (ops: BatchOp[], opts) => {
      const chunk = Math.min(opts?.chunkSize ?? 450, 450); // under Firestores 500-grænse
      let done = 0;
      for (let i = 0; i < ops.length; i += chunk) {
        if (opts?.shouldCancel?.()) return;
        const slice = ops.slice(i, i + chunk);
        const batch = api.newBatch();
        for (const op of slice) {
          const ref = api.docRef(op.path);
          if (op.type === 'set') batch.set(ref, op.data, { merge: op.merge ?? false });
          else if (op.type === 'update') batch.update(ref, op.data);
          else batch.delete(ref);
        }
        await batch.commit();
        done += slice.length;
        opts?.onProgress?.(done, ops.length);
      }
    },
  };
}

/** Auth-siden: også identisk på tværs, kun SDK-kaldene skifter. */
export function createAuth(api: {
  currentUser(): { uid: string; email: string | null } | null;
  onChange(cb: (user: { uid: string; email: string | null } | null) => void): Unsubscribe;
  signIn(email: string, password: string): Promise<unknown>;
  signOut(): Promise<unknown>;
}): AuthFacade {
  const toAuthUser = (
    user: { uid: string; email: string | null } | null
  ): AuthUser | null => (user ? { uid: user.uid, email: user.email } : null);

  return {
    getCurrentUser: () => toAuthUser(api.currentUser()),
    onAuthStateChanged: (cb) => api.onChange((user) => cb(toAuthUser(user))),
    signInWithEmail: async (email, password) => {
      await api.signIn(email, password);
    },
    signOut: async () => {
      await api.signOut();
    },
  };
}
