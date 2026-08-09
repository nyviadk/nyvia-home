import { type BatchOp, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { requireUid } from '@/lib/firebase/require-uid';
import { nowISO } from '@/lib/datetime';
import { toastAfter } from '@/lib/toast/notify';
import type { Wish, WishInput, WishlistSettings } from '../types';


const collPath = () => `users/${requireUid()}/wishlist`;
const docPath = (id: string) => `${collPath()}/${id}`;

/**
 * Byg skrive-data. ALLE felter skrives eksplicit — også de tomme (som '' / null / false).
 *
 * Firestore afviser `undefined`, så det var fristende bare at udelade tomme felter; men
 * `updateDoc` fletter, så et udeladt felt BEVARER sin gamle værdi. Slog man fx "pris inkl. fragt"
 * fra, blev `true` aldrig overskrevet og dukkede op igen ved genindlæsning. Derfor: tom = skriv
 * tom, aldrig udelad.
 */
function cleanInput(input: WishInput): Record<string, unknown> {
  return {
    title: input.title.trim(),
    favorite: !!input.favorite,
    quantity: Math.max(1, Math.floor(input.quantity || 1)),
    url: input.url?.trim() ?? '',
    imageUrl: input.imageUrl?.trim() ?? '',
    priceOre: typeof input.priceOre === 'number' ? input.priceOre : null,
    currency: input.currency?.trim() ?? 'DKK',
    shippingOre: typeof input.shippingOre === 'number' ? input.shippingOre : null,
    priceInclShipping: !!input.priceInclShipping,
    description: input.description?.trim() ?? '',
  };
}

export function subscribeWishes(
  onChange: (snap: CollectionSnapshot<Wish>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<Wish>(
    collPath(),
    { orderByField: 'createdAt', orderDirection: 'asc' },
    onChange,
    onError,
  );
}

export function createWish(input: WishInput): Promise<string> {
  const now = nowISO();
  // Nye ønsker sorteres sidst (stort order); reorder overskriver med 0..n.
  return toastAfter(
    db.addDoc(collPath(), {
      ...cleanInput(input),
      reservations: [],
      createdAt: now,
      updatedAt: now,
    }),
    'Ønske tilføjet',
  );
}

export function updateWish(id: string, input: WishInput): Promise<void> {
  return toastAfter(db.updateDoc(docPath(id), { ...cleanInput(input), updatedAt: nowISO() }), 'Gemt');
}

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export function deleteWish(id: string): Promise<void> {
  return db.deleteDoc(docPath(id));
}

export function setFavorite(id: string, favorite: boolean): Promise<void> {
  return db.updateDoc(docPath(id), { favorite, updatedAt: nowISO() });
}

/**
 * Nulstil ALT gæsterne har lavet (ejer, fx ny runde): reservationer på hvert ønske OG listen over
 * "købt uden for listen". Ejeren ser dem aldrig, men skal kunne rydde dem. Ét batch-kald.
 */
export async function resetAllReservations(
  wishIds: string[],
  guestDocIds: { extras: string[]; pot: string[]; comments: string[] },
): Promise<void> {
  const uid = requireUid();
  const del = (coll: string) => (id: string): BatchOp => ({
    type: 'delete',
    path: `users/${uid}/${coll}/${id}`,
  });
  const ops: BatchOp[] = [
    ...wishIds.map<BatchOp>((id) => ({ type: 'update', path: docPath(id), data: { reservations: [] } })),
    ...guestDocIds.extras.map(del('wishlistExtras')),
    ...guestDocIds.pot.map(del('wishlistPot')),
    ...guestDocIds.comments.map(del('wishlistComments')),
  ];
  if (ops.length === 0) return;
  await toastAfter(db.commitBatch(ops), 'Nulstillet');
}

/** Sti til en af ejerens gæste-collections (bruges kun til at kunne nulstille dem). */
export type GuestCollection = 'wishlistExtras' | 'wishlistPot' | 'wishlistComments';
const guestCollectionPath = (coll: GuestCollection): string =>
  `users/${requireUid()}/${coll}`;

/**
 * Ejerens egne gæste-collections. Kun id'erne bruges (til "nulstil") — indholdet vises aldrig
 * for ejeren.
 */
export function subscribeOwnGuestDocs(
  coll: GuestCollection,
  onChange: (snap: CollectionSnapshot<Record<string, unknown>>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<Record<string, unknown>>(
    guestCollectionPath(coll),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError,
  );
}

/* ---- Ejerens indstillinger til den offentlige side (navn + titel) ---- */

const settingsPath = () => `users/${requireUid()}/wishlistSettings/current`;

export function subscribeWishlistSettings(
  onChange: (settings: WishlistSettings | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeDoc<WishlistSettings>(settingsPath(), onChange, onError);
}

/** Alle felter skrives eksplicit, så et ryddet felt faktisk BLIVER ryddet. */
export function saveWishlistSettings(settings: WishlistSettings): Promise<void> {
  return toastAfter(
    db.setDoc(settingsPath(), { title: settings.title?.trim() ?? '' }, true),
    'Gemt',
  );
}
