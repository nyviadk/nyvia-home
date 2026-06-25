import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  addDoc as fbAddDoc,
  collection,
  deleteDoc as fbDeleteDoc,
  doc,
  getDoc as fbGetDoc,
  initializeFirestore,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  setDoc as fbSetDoc,
  updateDoc as fbUpdateDoc,
} from 'firebase/firestore';

import { assertFirebaseConfig, firebaseConfig } from './config';
import type { AuthFacade, AuthUser, CollectionSnapshot, DbFacade, WithId } from './facade';

assertFirebaseConfig();

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const fbAuth = getAuth(app);

// Offline-persistens (IndexedDB) — virker på tværs af faner.
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

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
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        onChange({
          docs: snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as WithId<T>
          ),
          fromCache: snap.metadata.fromCache,
          hasPendingWrites: snap.metadata.hasPendingWrites,
        });
      },
      (err) => onError?.(err)
    );
  },

  subscribeDoc: <T,>(
    path: string,
    onChange: (doc: WithId<T> | null) => void,
    onError?: (error: Error) => void
  ) =>
    onSnapshot(
      doc(firestore, path),
      { includeMetadataChanges: true },
      (snap) =>
        onChange(
          snap.exists()
            ? ({ id: snap.id, ...(snap.data() as Record<string, unknown>) } as WithId<T>)
            : null
        ),
      (err) => onError?.(err)
    ),

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
};
