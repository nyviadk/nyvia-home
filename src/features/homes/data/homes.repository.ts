import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { Home, HomeInput } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const collPath = () => `users/${requireUid()}/homes`;
const docPath = (id: string) => `${collPath()}/${id}`;

export function subscribeHomes(
  onChange: (snap: CollectionSnapshot<Home>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<Home>(
    collPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError
  );
}

export function createHome(input: HomeInput): Promise<string> {
  const now = nowISO();
  return toastAfter(
    db.addDoc<Home>(collPath(), { ...input, createdAt: now, updatedAt: now }),
    'Bolig oprettet'
  );
}

export function updateHome(id: string, input: HomeInput): Promise<void> {
  return toastAfter(db.updateDoc(docPath(id), { ...input, updatedAt: nowISO() }), 'Gemt');
}

/** Gemmer fri ekstra-info til indflytningssyn-PDF'en på boligen (rører ikke øvrige felter). */
export function updateHomeReportInfo(id: string, reportInfo: string): Promise<void> {
  return db.updateDoc(docPath(id), { reportInfo, updatedAt: nowISO() });
}

/** Sletning toaster ikke her — håndteres af performWithUndo (fortryd). */
export function deleteHome(id: string): Promise<void> {
  return db.deleteDoc(docPath(id));
}
