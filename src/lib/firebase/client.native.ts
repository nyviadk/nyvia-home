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

import { createAuth, createDb } from './create-db';
import type { AuthFacade, DbFacade, StorageFacade } from './facade';

// @react-native-firebase initialiserer automatisk fra google-services.json.
// Firestore offline-persistens er slået til som standard på native.
const fbAuth = getAuth();
const firestore = getFirestore();
const fbStorage = getFbStorage();

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
    const r = storageRef(fbStorage, path);
    await putFile(r, localUri);
    return getDownloadURL(r);
  },
  remove: async (path) => {
    await deleteObject(storageRef(fbStorage, path));
  },
};
