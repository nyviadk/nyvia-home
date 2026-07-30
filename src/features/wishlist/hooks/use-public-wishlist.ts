import { useLiveCollection, useLiveDoc } from '@/lib/db/use-live-query';
import { auth } from '@/lib/firebase';
import {
  subscribeComments,
  subscribeExtras,
  subscribePot,
  subscribePublicSettings,
  subscribePublicWishes,
} from '../data/wishlist-public.repository';
import {
  sortWishes,
  type GiftContribution,
  type Wish,
  type WishComment,
  type WishlistExtra,
  type WishlistSettings,
} from '../types';

/**
 * Data til den delte ønskeliste. Kan ikke bruge de globale stores, fordi ejerens uid kommer fra
 * URL'en og gæsten ikke er logget ind — derfor `useLiveCollection`, som pakker abonnementet én
 * gang i stedet for et `useState`+`useEffect`-par pr. kollektion.
 *
 * Ejeren må ikke se hvad gæsterne har lavet, så de tre gæste-kollektioner abonneres slet ikke
 * (key = null) frem for at blive hentet og skjult i UI'et.
 */
/**
 * Cache-nøgle. Kollektionens navn SKAL med: nøglen er global på tværs af alle `useLiveCollection`,
 * så delte alle fem abonnementer bare `ownerUid`, overskrev de hinandens cache. Efter et tilskud
 * lå der contributions under nøglen, og næste besøg på oversigten startede ønske-listen op med
 * dem — `sortWishes` faldt over et objekt uden `title` og tog hele siden med sig (hvid skærm).
 */
const cacheKey = (name: string, uid: string | null) => (uid ? `wishlist:${name}:${uid}` : null);

export function usePublicWishlist(ownerUid: string) {
  const isOwner = auth.getCurrentUser()?.uid === ownerUid;
  const guestKey = ownerUid && !isOwner ? ownerUid : null;

  const wishesQuery = useLiveCollection<Wish>(
    cacheKey('wishes', ownerUid || null),
    (onChange, onError) => subscribePublicWishes(ownerUid, onChange, onError),
  );
  const extrasQuery = useLiveCollection<WishlistExtra>(
    cacheKey('extras', guestKey),
    (onChange, onError) => subscribeExtras(ownerUid, onChange, onError),
  );
  const potQuery = useLiveCollection<GiftContribution>(
    cacheKey('pot', guestKey),
    (onChange, onError) => subscribePot(ownerUid, onChange, onError),
  );
  const commentsQuery = useLiveCollection<WishComment>(
    cacheKey('comments', guestKey),
    (onChange, onError) => subscribeComments(ownerUid, onChange, onError),
  );
  const settingsQuery = useLiveDoc<WishlistSettings>(
    cacheKey('settings', ownerUid || null),
    (onChange, onError) => subscribePublicSettings(ownerUid, onChange, onError),
  );

  const pot = potQuery.items;


  return {
    wishes: sortWishes(wishesQuery.items),
    extras: extrasQuery.items,
    pot,
    comments: commentsQuery.items,
    settings: settingsQuery.data,
    loading: wishesQuery.loading,
    failed: wishesQuery.failed,
    isOwner,
  };
}
