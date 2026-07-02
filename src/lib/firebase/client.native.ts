import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from '@react-native-firebase/auth';
import {
  addDoc as fbAddDoc,
  collection,
  deleteDoc as fbDeleteDoc,
  doc,
  getDoc as fbGetDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc as fbSetDoc,
  updateDoc as fbUpdateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage as getFbStorage,
  putFile,
  ref as storageRef,
} from '@react-native-firebase/storage';

import type {
  AuthFacade,
  AuthUser,
  CollectionSnapshot,
  DbFacade,
  StorageFacade,
  WithId,
} from './facade';

// @react-native-firebase initialiserer automatisk fra google-services.json.
// Firestore offline-persistens er slået til som standard på native.
const fbAuth = getAuth();
const firestore = getFirestore();
const fbStorage = getFbStorage();

function toAuthUser(user: { uid: string; email: string | null } | null): AuthUser | null {
  return user ? { uid: user.uid, email: user.email } : null;
}

export const auth: AuthFacade = {
  getCurrentUser: () => toAuthUser(fbAuth.currentUser),
  onAuthStateChanged: (cb) => fbOnAuthStateChanged(fbAuth, (user) => cb(toAuthUser(user))),
  signInWithEmail: async (email, password) => {
    await signInWithEmailAndPassword(fbAuth, email, password);
  },
  signOut: async () => {
    await fbSignOut(fbAuth);
  },
};

export const db: DbFacade = {
  subscribeCollection: <T,>(
    path: string,
    options: { orderByField?: string; orderDirection?: 'asc' | 'desc' },
    onChange: (snapshot: CollectionSnapshot<T>) => void,
    onError?: (error: Error) => void
  ) => {
    const base = collection(firestore, path);
    const q = options.orderByField
      ? query(base, orderBy(options.orderByField, options.orderDirection ?? 'asc'))
      : base;
    // Ved metadata-kun-emits (fx cache→server med SAMME data) genbruger vi forrige docs-
    // reference, så stores ikke overskriver items med et nyt array → ingen unødig re-render
    // eller forecast-genberegning. docChanges().length === 0 = intet dokument ændret siden sidst.
    let prevDocs: WithId<T>[] | null = null;
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const docs =
          prevDocs !== null && snap.docChanges().length === 0
            ? prevDocs
            : snap.docs.map(
                (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as WithId<T>
              );
        prevDocs = docs;
        onChange({
          docs,
          fromCache: snap.metadata.fromCache,
          hasPendingWrites: snap.metadata.hasPendingWrites,
        });
      },
      (err: Error) => onError?.(err)
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
    return onSnapshot(
      doc(firestore, path),
      { includeMetadataChanges: true },
      (snap) => {
        const data = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
        const key = data ? `${snap.id}|${JSON.stringify(data)}` : 'null';
        if (key === prevKey) return;
        prevKey = key;
        onChange(data ? ({ id: snap.id, ...data } as WithId<T>) : null);
      },
      (err: Error) => onError?.(err)
    );
  },

  getDoc: async <T,>(path: string): Promise<WithId<T> | null> => {
    const snap = await fbGetDoc(doc(firestore, path));
    return snap.exists()
      ? ({ id: snap.id, ...(snap.data() as Record<string, unknown>) } as WithId<T>)
      : null;
  },

  addDoc: async (collectionPath, data) => {
    const ref = await fbAddDoc(collection(firestore, collectionPath), data);
    return ref.id;
  },

  setDoc: async (docPath, data, merge = false) => {
    await fbSetDoc(doc(firestore, docPath), data, { merge });
  },

  updateDoc: async (docPath, data) => {
    await fbUpdateDoc(doc(firestore, docPath), data);
  },

  deleteDoc: async (docPath) => {
    await fbDeleteDoc(doc(firestore, docPath));
  },

  commitBatch: async (ops, opts) => {
    const chunk = Math.min(opts?.chunkSize ?? 450, 450); // under Firestores 500-grænse
    let done = 0;
    for (let i = 0; i < ops.length; i += chunk) {
      if (opts?.shouldCancel?.()) return;
      const slice = ops.slice(i, i + chunk);
      const batch = writeBatch(firestore);
      for (const op of slice) {
        const ref = doc(firestore, op.path);
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

export const storage: StorageFacade = {
  upload: async (path, localUri) => {
    const r = storageRef(fbStorage, path);
    await putFile(r, localUri);
    return getDownloadURL(r);
  },
  remove: async (path) => {
    await deleteObject(storageRef(fbStorage, path));
  },
};
