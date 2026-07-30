import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import type { WithId } from '@/lib/firebase';
import { formatDKKWhole } from '@/lib/money';
import { Pressable, View } from '@/tw';
import { CommentThread } from '../components/comment-thread';
import { GiftPrice } from '../components/gift-price';
import { deleteContribution, setReservations } from '../data/wishlist-public.repository';
import { usePublicWishlist } from '../hooks/use-public-wishlist';
import {
  namesLabel,
  remainingCount,
  reservationLabel,
  reservationQty,
  reservedCount,
  sumContributions,
  type GiftContribution,
} from '../types';

function SectionHead({ children }: { children: string }) {
  return <AppText className="text-2xl font-bold text-fg">{children}</AppText>;
}

/**
 * Gavens egen side: alt det der før var klemt ned i oversigtskortet — reservationer, penge,
 * kommentarer og handlinger. Kortene er dermed rene og kan stå tre i bredden.
 */
export function GiftScreen({ ownerUid, wishId }: { ownerUid: string; wishId: string }) {
  const router = useRouter();
  const { wishes, pot, comments, loading, isOwner } = usePublicWishlist(ownerUid);
  const wish = wishes.find((w) => w.id === wishId);

  if (!wish) {
    return (
      <Screen className="max-w-200 p-6">
        {loading ? <View /> : <EmptyState title="Gaven findes ikke" description="Den er måske slettet." />}
      </Screen>
    );
  }

  const total = wish.quantity || 1;
  const left = remainingCount(wish);
  const taken = reservedCount(wish);
  const list = wish.reservations ?? [];
  const contributions = pot.filter((c) => c.wishId === wish.id);
  const pledged = sumContributions(contributions);
  const goal = typeof wish.priceOre === 'number' ? wish.priceOre : 0;
  const giftComments = comments.filter((c) => c.wishId === wish.id);
  /**
   * Er alt taget, er tilskuddet ikke længere en åben mulighed — så alle involverede nævnes bare
   * samlet på reservationen frem for i to adskilte sektioner.
   */
  const fullyReserved = left === 0 && list.length > 0;
  const contributorNames = [...new Set(contributions.map((c) => namesLabel(c.by)))];

  const go = (pathname: '/w/[uid]/reserve' | '/w/[uid]/give', params: Record<string, string> = {}) =>
    router.push({ pathname, params: { uid: ownerUid, wishId: wish.id, ...params } });

  const onRemoveReservation = async (index: number) => {
    const target = list[index];
    if (!target) return;
    const ok = await confirmAction(
      'Fjern reservering',
      `Fjern “${reservationLabel(target)}” fra "${wish.title}"?`,
      'Fjern',
    );
    if (!ok) return;
    await setReservations(ownerUid, wish.id, list.filter((_, i) => i !== index), 'Fjernet');
  };

  /** Slet beløbet helt. Kom pengene fra puljen, gør advarslen opmærksom på "Ryk til puljen". */
  const onRemoveContribution = async (c: WithId<GiftContribution>) => {
    const ok = await confirmAction(
      'Fjern beløb',
      'Beløbet slettes helt.',
      'Fjern',
    );
    if (ok) await deleteContribution(ownerUid, c.id);
  };

  return (
    <Screen className="max-w-200 gap-0 p-6">
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} className="self-start py-2">
        <AppText className="text-xl font-semibold text-primary">‹ Tilbage til listen</AppText>
      </Pressable>

      <View className="h-4" />

      <View
        className="w-full overflow-hidden rounded-3xl bg-element"
        style={{ aspectRatio: 16 / 9, borderCurve: 'continuous' }}>
        {wish.imageUrl ? (
          <Image source={{ uri: wish.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <AppText className="text-6xl">🎁</AppText>
          </View>
        )}
      </View>

      <View className="h-6" />

      <View className="gap-2">
        <AppText className="text-4xl font-bold leading-tight text-fg">
          {wish.favorite ? '⭐ ' : ''}
          {total > 1 ? `${total}x ` : ''}
          {wish.title}
        </AppText>
        <GiftPrice wish={wish} />
        {wish.description ? (
          <AppText className="text-xl leading-relaxed text-fg">{wish.description}</AppText>
        ) : null}
        {wish.url ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL(wish.url!)}
            className="mt-3 items-center rounded-2xl border-2 border-primary py-3.5 active:bg-element"
            style={{ borderCurve: 'continuous' }}>
            <AppText className="text-xl font-bold text-primary">Åbn i butik ↗</AppText>
          </Pressable>
        ) : null}
      </View>

      {isOwner ? null : (
        <>
          {left > 0 ? (
            <>
              <View className="h-8" />
              <View className="gap-3">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => go('/w/[uid]/reserve')}
                  className="items-center rounded-2xl bg-primary py-4 active:opacity-80"
                  style={{ borderCurve: 'continuous' }}>
                  <AppText className="text-xl font-bold text-on-primary">
                    Reservér{total > 1 ? ` · ${left} tilbage` : ''}
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => go('/w/[uid]/give')}
                  className="items-center rounded-2xl border border-border py-3.5 active:bg-element"
                  style={{ borderCurve: 'continuous' }}>
                  <AppText className="text-lg font-semibold text-fg">Læg et beløb</AppText>
                </Pressable>
              </View>
            </>
          ) : null}

          {list.length > 0 ? (
            <>
              <View className="h-10" />
              <View className="gap-3">
                <SectionHead>
                  {total > 1 ? `Reserveret · ${taken} af ${total}` : 'Reserveret'}
                </SectionHead>
                {list.map((r, i) => (
                  <View
                    key={`r-${i}`}
                    className="gap-1.5 rounded-2xl bg-element p-4"
                    style={{ borderCurve: 'continuous' }}>
                    <AppText className="text-xl font-bold text-fg">
                      {[reservationLabel(r), ...(fullyReserved && i === 0 ? contributorNames : [])].join(
                        ', ',
                      )}
                      {reservationQty(r) > 1 ? (
                        <AppText className="text-lg font-normal text-fg"> · {reservationQty(r)} stk.</AppText>
                      ) : null}
                    </AppText>
                    <View className="flex-row flex-wrap gap-x-5 gap-y-1">
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => go('/w/[uid]/reserve', { index: String(i) })}>
                        <AppText className="text-lg font-semibold text-primary">Redigér</AppText>
                      </Pressable>
                      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void onRemoveReservation(i)}>
                        <AppText className="text-lg font-semibold text-danger">Fjern</AppText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {contributions.length > 0 && !fullyReserved ? (
            <>
              <View className="h-10" />
              <View className="gap-3">
                <SectionHead>{`Tilskud · ${formatDKKWhole(pledged)} i alt`}</SectionHead>
                {contributions.map((c) => (
                  <View
                    key={c.id}
                    className="gap-1.5 rounded-2xl bg-element p-4"
                    style={{ borderCurve: 'continuous' }}>
                    <AppText className="text-xl font-bold text-fg">
                      {namesLabel(c.by)}
                      <AppText className="text-lg font-normal text-fg"> · {formatDKKWhole(c.amountOre)}</AppText>
                    </AppText>
                    <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void onRemoveContribution(c)}>
                      <AppText className="text-lg font-semibold text-danger">Fjern</AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View className="h-10" />
          <View className="gap-3">
            <SectionHead>Kommentarer</SectionHead>
            <View className="rounded-2xl bg-element p-4" style={{ borderCurve: 'continuous' }}>
              <CommentThread ownerUid={ownerUid} wishId={wish.id} comments={giftComments} />
            </View>
          </View>
        </>
      )}

      <View className="h-16" />
    </Screen>
  );
}
