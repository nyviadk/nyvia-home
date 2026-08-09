import { nowISO } from '@/lib/datetime';
import { type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type {
  WishlistSettings,
  GiftContribution,
  Wish,
  WishComment,
  WishlistExtra,
  WishReservation,
} from '../types';

/**
 * Offentlig (delelink) adgang til en ejers ønskeliste. Modsat `wishlist.repository` bruger den
 * IKKE den indloggede bruger — ejerens uid kommer fra URL'en, så gæster uden login kan læse
 * ønskerne og skrive reservationer. Adgangen styres af Firestore-reglerne.
 */

const collPath = (ownerUid: string) => `users/${ownerUid}/wishlist`;
const extrasPath = (ownerUid: string) => `users/${ownerUid}/wishlistExtras`;
// Sti-navnet er historisk (hed engang en "pulje") — bevaret, så eksisterende data ikke tabes.
const potPath = (ownerUid: string) => `users/${ownerUid}/wishlistPot`;
const commentsPath = (ownerUid: string) => `users/${ownerUid}/wishlistComments`;

export function subscribePublicWishes(
  ownerUid: string,
  onChange: (snap: CollectionSnapshot<Wish>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<Wish>(
    collPath(ownerUid),
    { orderByField: 'createdAt', orderDirection: 'asc' },
    onChange,
    onError,
  );
}

/**
 * Skriv den fulde reservations-liste for ét ønske (last-write-wins).
 * `message: null` skriver uden kvittering — når kalderen selv viser en fortryd-toast.
 */
export function setReservations(
  ownerUid: string,
  wishId: string,
  reservations: WishReservation[],
  message: string | null,
): Promise<void> {
  const write = db.updateDoc(`${collPath(ownerUid)}/${wishId}`, { reservations });
  return message === null ? write : toastAfter(write, message);
}

/* ---- Købt uden for listen ---- */

export function subscribeExtras(
  ownerUid: string,
  onChange: (snap: CollectionSnapshot<WishlistExtra>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<WishlistExtra>(
    extrasPath(ownerUid),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError,
  );
}

export function addExtra(ownerUid: string, text: string, by: string[]): Promise<string> {
  return toastAfter(
    db.addDoc<WishlistExtra>(extrasPath(ownerUid), {
      text: text.trim(),
      by,
      createdAt: nowISO(),
    }),
    'Tilføjet til listen',
  );
}

/** Alle felter skrives eksplicit, så et ryddet felt faktisk BLIVER ryddet (updateDoc fletter). */
export function updateExtra(
  ownerUid: string,
  id: string,
  text: string,
  by: string[],
): Promise<void> {
  return toastAfter(
    db.updateDoc(`${extrasPath(ownerUid)}/${id}`, { text: text.trim(), by }),
    'Opdateret',
  );
}

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export function deleteExtra(ownerUid: string, id: string): Promise<void> {
  return db.deleteDoc(`${extrasPath(ownerUid)}/${id}`);
}

/* ---- Pengebidrag (fælles pulje + øremærket pr. gave) ---- */

export function subscribePot(
  ownerUid: string,
  onChange: (snap: CollectionSnapshot<GiftContribution>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<GiftContribution>(
    potPath(ownerUid),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError,
  );
}

export function addContribution(
  ownerUid: string,
  input: { by: string[]; amountOre: number; wishId: string },
): Promise<string> {
  return toastAfter(
    db.addDoc<GiftContribution>(potPath(ownerUid), {
      by: input.by,
      amountOre: input.amountOre,
      wishId: input.wishId,
      createdAt: nowISO(),
    }),
    'Tilskud tilføjet',
  );
}

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export function deleteContribution(ownerUid: string, id: string): Promise<void> {
  return db.deleteDoc(`${potPath(ownerUid)}/${id}`);
}

/* ---- Kommentarer ---- */

export function subscribeComments(
  ownerUid: string,
  onChange: (snap: CollectionSnapshot<WishComment>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<WishComment>(
    commentsPath(ownerUid),
    { orderByField: 'createdAt', orderDirection: 'asc' },
    onChange,
    onError,
  );
}

export function addComment(
  ownerUid: string,
  input: { by: string[]; text: string; wishId: string | null },
): Promise<string> {
  return db.addDoc<WishComment>(commentsPath(ownerUid), {
    by: input.by,
    text: input.text.trim(),
    wishId: input.wishId,
    createdAt: nowISO(),
  });
}

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export function deleteComment(ownerUid: string, id: string): Promise<void> {
  return db.deleteDoc(`${commentsPath(ownerUid)}/${id}`);
}

/* ---- Ejerens indstillinger (navn + titel), læses af den offentlige side ---- */

const settingsPath = (ownerUid: string) => `users/${ownerUid}/wishlistSettings/current`;

export function subscribePublicSettings(
  ownerUid: string,
  onChange: (settings: WishlistSettings | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeDoc<WishlistSettings>(settingsPath(ownerUid), onChange, onError);
}


