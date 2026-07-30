import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Linking } from 'react-native';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { formatDKKWhole } from '@/lib/money';
import { Pressable, View } from '@/tw';
import { setFavorite } from '../data/wishlist.repository';
import type { Wish } from '../types';

/** Pris-linje: "1.299 kr. + 49 kr. fragt" / "… inkl. fragt" / kun pris / tomt. */
function priceLine(w: Wish): string {
  if (typeof w.priceOre !== 'number') return '';
  const base = formatDKKWhole(w.priceOre);
  if (w.priceInclShipping) return `${base} inkl. fragt`;
  if (typeof w.shippingOre === 'number' && w.shippingOre > 0)
    return `${base} + ${formatDKKWhole(w.shippingOre)} fragt`;
  return base;
}

/** Ejer-kort. Viser ALDRIG reservationer. */
export function WishCard({ wish }: { wish: WithId<Wish> }) {
  const price = priceLine(wish);
  return (
    <Card className="flex-row gap-3 p-3">
      <View className="h-20 w-20 overflow-hidden rounded-xl bg-element" style={{ borderCurve: 'continuous' }}>
        {wish.imageUrl ? (
          <Image source={{ uri: wish.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <AppText className="text-2xl">🎁</AppText>
          </View>
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-start gap-2">
          <AppText variant="label" className="flex-1">
            {wish.title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => setFavorite(wish.id, !wish.favorite)}>
            <AppText className="text-base" style={{ color: wish.favorite ? '#d9a441' : '#7a756c' }}>
              {wish.favorite ? '★' : '☆'}
            </AppText>
          </Pressable>
        </View>

        {price ? <AppText className="text-sm font-semibold">{price}</AppText> : null}
        {wish.quantity > 1 ? (
          <AppText variant="muted" className="text-xs">
            Ønsket: {wish.quantity} stk.
          </AppText>
        ) : null}

        <View className="mt-1 flex-row items-center gap-4">
          {wish.url ? (
            <Pressable accessibilityRole="button" hitSlop={4} onPress={() => Linking.openURL(wish.url!)}>
              <AppText className="text-sm font-semibold text-primary">Åbn i butik ↗</AppText>
            </Pressable>
          ) : null}
          <Link href={{ pathname: '/onskeliste/[id]', params: { id: wish.id } }} asChild>
            <Pressable accessibilityRole="button" hitSlop={4}>
              <AppText variant="muted" className="text-sm">
                Redigér
              </AppText>
            </Pressable>
          </Link>
        </View>
      </View>
    </Card>
  );
}
