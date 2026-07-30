import { Image } from 'expo-image';

import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { formatDKKWhole } from '@/lib/money';
import { Pressable, View } from '@/tw';
import {
  remainingCount,
  reservedCount,
  sumContributions,
  type GiftContribution,
  type Wish,
} from '../types';

function priceLine(w: Wish): string {
  if (typeof w.priceOre !== 'number') return '';
  const base = formatDKKWhole(w.priceOre);
  if (w.priceInclShipping) return `${base} inkl. fragt`;
  if (typeof w.shippingOre === 'number' && w.shippingOre > 0)
    return `${base} + ${formatDKKWhole(w.shippingOre)} fragt`;
  return base;
}

/**
 * Oversigtskort — bevidst KORT: billede, titel, pris og en enkelt status-linje.
 *
 * Reservationer, beløb, kommentarer og handlinger ligger på gavens egen side; det hele var før
 * klemt ned i kortet, hvilket gjorde tre kolonner umuligt og gjorde det svært at skimme listen.
 * Hele kortet er ét tryk ind til gaven.
 */
export function PublicWishCard({
  wish,
  isOwner,
  contributions,
  commentCount,
  onOpen,
}: {
  wish: WithId<Wish>;
  isOwner: boolean;
  contributions: WithId<GiftContribution>[];
  commentCount: number;
  onOpen: () => void;
}) {
  const total = wish.quantity || 1;
  const left = remainingCount(wish);
  const taken = reservedCount(wish);
  const fullyTaken = !isOwner && left === 0;
  const price = priceLine(wish);
  const pledged = sumContributions(contributions);
  const goal = typeof wish.priceOre === 'number' ? wish.priceOre : 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      className="h-full overflow-hidden rounded-3xl border border-border bg-card active:opacity-90"
      style={{ borderCurve: 'continuous', boxShadow: '0 6px 20px rgba(40, 40, 38, 0.06)' }}>
      <View className="w-full bg-element" style={{ aspectRatio: 4 / 3, opacity: fullyTaken ? 0.4 : 1 }}>
        {wish.imageUrl ? (
          <Image source={{ uri: wish.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <AppText className="text-5xl">🎁</AppText>
          </View>
        )}
      </View>
      {wish.favorite ? (
        <View className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-star">
          <AppText className="text-lg">⭐</AppText>
        </View>
      ) : null}
      {fullyTaken ? (
        <View className="absolute left-3 top-3 rounded-full bg-fg px-3 py-1.5">
          <AppText className="text-base font-bold text-card">Reserveret</AppText>
        </View>
      ) : null}

      <View className="flex-1 gap-1.5 p-5">
        <AppText className="text-2xl font-bold leading-tight text-fg">
          {total > 1 ? `${total}x ` : ''}
          {wish.title}
        </AppText>
        {price ? <AppText className="text-xl font-semibold text-primary">{price}</AppText> : null}

        <View className="flex-1" />

        {isOwner ? null : (
          <View className="gap-1.5 pt-2">
            {/* Er alt taget, nævnes tilskudsgiverne på selve reservationen — ikke som et løst tal. */}
            {pledged > 0 && !fullyTaken ? (
              <View className="gap-1.5">
                <AppText className="text-lg font-semibold text-fg">
                  {formatDKKWhole(pledged)}
                  {goal > 0 ? ` af ${formatDKKWhole(goal)}` : ''} i tilskud
                </AppText>
                {goal > 0 ? <ProgressBar value={Math.min(1, pledged / goal)} /> : null}
              </View>
            ) : null}
            {!fullyTaken && taken > 0 ? (
              <AppText className="text-lg text-fg">
                {taken} af {total} reserveret
              </AppText>
            ) : null}
            {commentCount > 0 ? (
              <AppText className="text-lg text-fg">
                {commentCount} {commentCount === 1 ? 'kommentar' : 'kommentarer'}
              </AppText>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}
