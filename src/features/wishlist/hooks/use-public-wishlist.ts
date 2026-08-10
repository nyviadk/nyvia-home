import { useAuthStore } from '@/lib/auth/auth-store';
import { withoutPending } from '@/lib/db/pending-deletes';
import { useLiveCollection, useLiveDoc } from '@/lib/db/use-live-query';
import {
  pendingCommentDeletes,
  pendingContributionDeletes,
  pendingExtraDeletes,
} from '../data/pending-deletes';
import { useWishlistStore } from '../data/wishlist-store';
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
  const viewer = useAuthStore((s) => s.user);
  const authKnown = useAuthStore((s) => !s.initializing);

  /**
   * To forskellige spørgsmål, fordi ét frame er nok til at spolere overraskelsen:
   *
   * `isOwner` = "vi VED at det er ejeren" og bruges til at sige det højt på skærmen.
   * `hideGuestInfo` = "vi ved ikke at det IKKE er ejeren" og styrer alt det hemmelige. Den er
   * sand indtil auth er afgjort, så gæsternes reservationer aldrig kan nå at blive malet.
   *
   * Begge blev før udledt af `auth.getCurrentUser()` læst direkte under render — ikke
   * reaktivt, og typisk null i første render, fordi Firebase gendanner sessionen asynkront.
   * Ejeren så derfor sine egne gæsters reservationer blinke forbi ved kold indlæsning.
   */
  const isOwner = authKnown && viewer?.uid === ownerUid;
  const hideGuestInfo = !authKnown || isOwner;
  const guestKey = ownerUid && !hideGuestInfo ? ownerUid : null;

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

  // Optimistisk slettede filtreres væk ÉT sted, så alle gæste-skærme (oversigt, gave,
  // ekstra) viser det samme under fortryd-vinduet.
  const wishes = withoutPending(wishesQuery.items, useWishlistStore.pending.useStore((s) => s.ids));
  const extras = withoutPending(extrasQuery.items, pendingExtraDeletes.useStore((s) => s.ids));
  const pot = withoutPending(potQuery.items, pendingContributionDeletes.useStore((s) => s.ids));
  const comments = withoutPending(
    commentsQuery.items,
    pendingCommentDeletes.useStore((s) => s.ids)
  );

  return {
    wishes: sortWishes(wishes),
    extras,
    pot,
    comments,
    settings: settingsQuery.data,
    loading: wishesQuery.loading,
    failed: wishesQuery.failed,
    isOwner,
    hideGuestInfo,
  };
}
