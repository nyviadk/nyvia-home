import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { SITE_URL } from '@/constants/site';
import { confirmAction } from '@/lib/confirm';
import { auth } from '@/lib/firebase';
import { notify, toastAfter } from '@/lib/toast/notify';
import { useLiveCollection } from '@/lib/db/use-live-query';
import { Pressable, View } from '@/tw';

import { WishCard } from '../components/wish-card';
import {
  resetAllReservations,
  subscribeOwnGuestDocs,
} from '../data/wishlist.repository';
import { useWishlistStore } from '../data/wishlist-store';
import { sortWishes } from '../types';

/** Ejer-oversigt. Reservationer vises ALDRIG her. Favoritter ligger øverst. */
export function WishlistScreen() {
  const items = useWishlistStore((s) => s.items);
  const loading = useWishlistStore((s) => s.loading);
  const fromCache = useWishlistStore((s) => s.fromCache);
  // Kun id'erne bruges — "nulstil" skal kunne rydde gæsternes data UDEN at ejeren ser indholdet.
  const extrasQuery = useLiveCollection('own-extras', (c, e) =>
    subscribeOwnGuestDocs('wishlistExtras', c, e),
  );
  const potQuery = useLiveCollection('own-pot', (c, e) => subscribeOwnGuestDocs('wishlistPot', c, e));
  const commentsQuery = useLiveCollection('own-comments', (c, e) =>
    subscribeOwnGuestDocs('wishlistComments', c, e),
  );
  const ids = (q: { items: { id: string }[] }) => q.items.map((d) => d.id);
  const guestDocs = {
    extras: ids(extrasQuery),
    pot: ids(potQuery),
    comments: ids(commentsQuery),
  };
  const hasGuestData =
    guestDocs.extras.length + guestDocs.pot.length + guestDocs.comments.length > 0;

  // Favoritter øverst, derefter pris lav→høj.
  const sorted = sortWishes(items);

  /** Kopiér delelinket (web) — gæster åbner det uden login. */
  const copyShareLink = () => {
    const uid = auth.getCurrentUser()?.uid;
    if (!uid) return;
    const link = `${SITE_URL}/w/${uid}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void toastAfter(navigator.clipboard.writeText(link), 'Delelink kopieret');
    } else {
      notify(link);
    }
  };

  const onReset = async () => {
    if (items.length === 0 && !hasGuestData) return;
    const ok = await confirmAction(
      'Nulstil reserveringer',
      'Alle ønsker bliver ledige igen, og puljen, kommentarerne og "købt uden for listen" ryddes (fx til en ny runde). Du får stadig ikke at vide, hvad der stod.',
      'Nulstil',
    );
    if (ok) await resetAllReservations(items.map((w) => w.id), guestDocs);
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="title">Ønskeliste</AppText>
        <View className="flex-row items-center gap-4">
          <Link href="/onskeliste/settings" asChild>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <AppText className="text-sm font-semibold text-primary">Indstillinger</AppText>
            </Pressable>
          </Link>
          <Link href="/onskeliste/new" asChild>
            <Button title="Tilføj" className="h-10 px-4" />
          </Link>
        </View>
      </View>

      <OfflineNotice fromCache={fromCache} />

      {items.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen ønsker endnu"
            description="Tilføj dit første ønske — indsæt et link, eller skriv det selv."
          />
        )
      ) : (
        <>
          <View className="gap-2">
            {sorted.map((w) => (
              <WishCard key={w.id} wish={w} />
            ))}
          </View>
          <View className="flex-row items-center justify-center gap-6 py-2">
            <Pressable accessibilityRole="button" hitSlop={8} onPress={copyShareLink}>
              <AppText className="text-sm font-semibold text-primary">🔗 Kopiér delelink</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onReset}>
              <AppText variant="muted" className="text-sm">
                ↺ Nulstil reserveringer
              </AppText>
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}
