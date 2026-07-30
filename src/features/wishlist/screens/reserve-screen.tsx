import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { formatDKKWhole, parseKronerInput } from '@/lib/money';
import { Pressable, View } from '@/tw';
import { Input } from '@/components/ui/input';
import { GiftPrice } from '../components/gift-price';
import { NameField, namesFromField } from '../components/name-field';
import { setReservations } from '../data/wishlist-public.repository';
import { usePublicWishlist } from '../hooks/use-public-wishlist';
import {
  namesLabel,
  remainingCount,
  reservationNames,
  type Wish,
  type WishReservation,
} from '../types';

function StepBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={cn('px-6 py-3', disabled ? 'opacity-30' : 'active:bg-selected')}>
      <AppText className="text-2xl leading-none text-fg">{label}</AppText>
    </Pressable>
  );
}

/**
 * Formularen. Monteres FØRST når ønsket er hentet — ellers ville `useState`-initializerne køre på
 * tom data, og "Redigér" ville åbne blanke felter.
 */
function ReserveForm({
  ownerUid,
  wish,
  index,
  contributors,
}: {
  ownerUid: string;
  wish: WithId<Wish>;
  index?: number;
  /** Dem der har givet tilskud — man deler reelt gaven med dem. */
  contributors: string[];
}) {
  const router = useRouter();
  const existing = index != null ? (wish.reservations ?? [])[index] : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(() => (existing ? reservationNames(existing).join(' & ') : ''));
  const [qty, setQty] = useState(() => Math.max(1, existing?.qty ?? 1));
  const [busy, setBusy] = useState(false);

  const goal = typeof wish.priceOre === 'number' ? wish.priceOre : 0;

  // Ved redigering må man bruge det resterende PLUS det, denne reservation allerede optager.
  const maxQty = Math.max(1, remainingCount(wish) + (existing?.qty ?? 0));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    const reservation: WishReservation = {
      by: namesFromField(name),
      qty: Math.max(1, Math.min(qty, maxQty)),
    };
    const next = isEdit
      ? (wish.reservations ?? []).map((r, i) => (i === index ? reservation : r))
      : [...(wish.reservations ?? []), reservation];
    try {
      await setReservations(ownerUid, wish.id, next, isEdit ? 'Opdateret' : 'Reserveret');
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="max-w-200 gap-0 p-6">
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} className="self-start py-2">
        <AppText className="text-xl font-semibold text-primary">‹ Tilbage til listen</AppText>
      </Pressable>

      <View className="h-4" />

      <View className="gap-2">
        <AppText className="text-4xl font-bold leading-tight text-fg">
          {isEdit ? 'Redigér reservering' : 'Reservér'}
        </AppText>
        <AppText className="text-xl leading-relaxed text-fg">{wish.title}</AppText>
        <GiftPrice wish={wish} />
        {contributors.length > 0 ? (
          <AppText className="text-xl text-fg">sammen med {contributors.join(', ')}</AppText>
        ) : null}
      </View>

      {maxQty > 1 ? (
        <>
          <View className="h-10" />
          <View className="gap-3">
            <AppText className="text-2xl font-bold text-fg">Hvor mange?</AppText>
                <View
              className="flex-row items-center self-start overflow-hidden rounded-2xl border border-border bg-card"
              style={{ borderCurve: 'continuous' }}>
              <StepBtn label="−" onPress={() => setQty((n) => Math.max(1, n - 1))} disabled={qty <= 1} />
              <View className="items-center border-x border-border py-3" style={{ minWidth: 72 }}>
                <AppText className="text-2xl font-bold text-fg">{qty}</AppText>
              </View>
              <StepBtn label="+" onPress={() => setQty((n) => Math.min(maxQty, n + 1))} disabled={qty >= maxQty} />
            </View>
          </View>
        </>
      ) : null}

      <View className="h-10" />


      <View className="h-10" />

      <NameField value={name} onChangeText={setName} />



      <View className="h-12" />

      <Button
        title={isEdit ? 'Gem ændringer' : 'Reservér'}
        className="h-16"
        loading={busy}
        onPress={save}
      />

      <View className="h-16" />
    </Screen>
  );
}

/** Reservér / redigér — som fuld skærm, ikke modal. */
export function ReserveScreen({
  ownerUid,
  wishId,
  index,
}: {
  ownerUid: string;
  wishId: string;
  index?: number;
}) {
  const { wishes, pot, loading } = usePublicWishlist(ownerUid);
  const wish = wishes.find((w) => w.id === wishId);

  if (!wish) {
    return (
      <Screen className="max-w-200 p-6">
        {loading ? <View /> : <EmptyState title="Ønsket findes ikke" description="Det er måske slettet." />}
      </Screen>
    );
  }

  // `key` sikrer frisk state, hvis man skifter mellem reservationer.
  return (
    <ReserveForm
      key={`${wish.id}-${index ?? 'new'}`}
      ownerUid={ownerUid}
      wish={wish}
      index={index}
      contributors={[
        ...new Set(pot.filter((c) => c.wishId === wish.id).map((c) => namesLabel(c.by))),
      ]}
    />
  );
}
