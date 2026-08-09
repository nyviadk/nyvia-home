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
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';

import { assertFirebaseConfig, firebaseConfig } from './config';
import { createAuth, createDb } from './create-db';
import type { AuthFacade, DbFacade, StorageFacade } from './facade';

assertFirebaseConfig();

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const fbAuth = getAuth(app);
const fbStorage = getStorage(app);

// Offline-persistens (IndexedDB) — virker på tværs af faner.
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth: AuthFacade = createAuth({
  currentUser: () => fbAuth.currentUser,
  onChange: (cb) => fbOnAuthStateChanged(fbAuth, cb),
  signIn: (email, password) => signInWithEmailAndPassword(fbAuth, email, password),
  signOut: () => fbSignOut(fbAuth),
});

export const db: DbFacade = createDb({
  queryRef: (path, order) => {
    const base = collection(firestore, path);
    return order ? query(base, orderBy(order.field, order.direction)) : base;
  },
  docRef: (path) => doc(firestore, path),
  onQuerySnapshot: (q, onNext, onError) =>
    onSnapshot(q, { includeMetadataChanges: true }, onNext, onError),
  onDocSnapshot: (ref, onNext, onError) =>
    onSnapshot(ref, { includeMetadataChanges: true }, onNext, onError),
  getDocOnce: (ref) => fbGetDoc(ref),
  addDocument: (path, data) => fbAddDoc(collection(firestore, path), data),
  setDocument: (ref, data, merge) => fbSetDoc(ref, data, { merge }),
  updateDocument: (ref, data) => fbUpdateDoc(ref, data),
  deleteDocument: (ref) => fbDeleteDoc(ref),
  newBatch: () => writeBatch(firestore),
});

export const storage: StorageFacade = {
  upload: async (path, localUri) => {
    const blob = await (await fetch(localUri)).blob();
    const r = storageRef(fbStorage, path);
    await uploadBytes(r, blob);
    return getDownloadURL(r);
  },
  remove: async (path) => {
    await deleteObject(storageRef(fbStorage, path));
  },
};
