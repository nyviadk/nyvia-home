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
export function usePublicWishlist(ownerUid: string) {
  const isOwner = auth.getCurrentUser()?.uid === ownerUid;
  const guestKey = ownerUid && !isOwner ? ownerUid : null;

  const wishesQuery = useLiveCollection<Wish>(ownerUid || null, (onChange, onError) =>
    subscribePublicWishes(ownerUid, onChange, onError),
  );
  const extrasQuery = useLiveCollection<WishlistExtra>(guestKey, (onChange, onError) =>
    subscribeExtras(ownerUid, onChange, onError),
  );
  const potQuery = useLiveCollection<GiftContribution>(guestKey, (onChange, onError) =>
    subscribePot(ownerUid, onChange, onError),
  );
  const commentsQuery = useLiveCollection<WishComment>(guestKey, (onChange, onError) =>
    subscribeComments(ownerUid, onChange, onError),
  );
  const settingsQuery = useLiveDoc<WishlistSettings>(ownerUid || null, (onChange, onError) =>
    subscribePublicSettings(ownerUid, onChange, onError),
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
