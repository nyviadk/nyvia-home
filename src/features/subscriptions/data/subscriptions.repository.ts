import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { PriceChange } from '@/features/budget/types';
import type { Subscription, SubscriptionInput } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const collPath = () => `users/${requireUid()}/subscriptions`;
const docPath = (id: string) => `${collPath()}/${id}`;

export function subscribeSubscriptions(
  onChange: (snap: CollectionSnapshot<Subscription>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<Subscription>(
    collPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError
  );
}

export function createSubscription(input: SubscriptionInput): Promise<string> {
  const now = nowISO();
  return toastAfter(
    db.addDoc<Subscription>(collPath(), { ...input, createdAt: now, updatedAt: now }),
    'Abonnement oprettet'
  );
}

export function updateSubscription(id: string, input: SubscriptionInput): Promise<void> {
  return toastAfter(db.updateDoc(docPath(id), { ...input, updatedAt: nowISO() }), 'Gemt');
}

export function setSubscriptionActive(id: string, active: boolean): Promise<void> {
  return toastAfter(
    db.updateDoc(docPath(id), { active, updatedAt: nowISO() }),
    active ? 'Aktiveret' : 'Sat på pause'
  );
}

export function updateSubscriptionPriceChanges(
  id: string,
  priceChanges: PriceChange[]
): Promise<void> {
  return toastAfter(
    db.updateDoc(docPath(id), { priceChanges, updatedAt: nowISO() }),
    'Prisændring gemt'
  );
}

/** Sletning toaster ikke her — håndteres af performWithUndo (fortryd). */
export function deleteSubscription(id: string): Promise<void> {
  return db.deleteDoc(docPath(id));
}
