import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { formatDKKWhole, parseKronerInput } from '@/lib/money';
import { Input } from '@/components/ui/input';
import { Pressable, View } from '@/tw';
import { NameField, namesFromField } from '../components/name-field';
import { addContribution } from '../data/wishlist-public.repository';
import { usePublicWishlist } from '../hooks/use-public-wishlist';
import { sumContributions } from '../types';

/**
 * Læg NYE penge — enten i den fælles pulje (`wishId` tom) eller direkte på en gave.
 *
 * At bruge penge der ALLEREDE ligger i puljen hører hjemme under "Reservér": der tager man gaven
 * og finansierer den, hvilket er den samme handling.
 */
export function GiveScreen({ ownerUid, wishId }: { ownerUid: string; wishId: string }) {
  const router = useRouter();
  const { wishes, pot } = usePublicWishlist(ownerUid);
  const wish = wishes.find((w) => w.id === wishId);

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const amountOre = parseKronerInput(amount);
  // Man kan ikke lægge mere end der mangler: prisen minus det andre allerede har givet.
  const goal = typeof wish?.priceOre === 'number' ? wish.priceOre : 0;
  const already = wish ? sumContributions(pot.filter((c) => c.wishId === wish.id)) : 0;
  const maxOre = goal > 0 ? Math.max(0, goal - already) : null;
  const tooMuch = maxOre !== null && (amountOre ?? 0) > maxOre;

  // Navn er PÅKRÆVET her: andre skal kunne se hvem der har lagt penge. Vil man ikke oplyse
  // beløbet, giver man kontant i stedet.
  const canSave = (amountOre ?? 0) > 0 && !tooMuch && name.trim().length > 0 && !busy && !!wish;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await addContribution(ownerUid, {
        by: namesFromField(name),
        amountOre: amountOre ?? 0,
        wishId: wishId,
      });
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
        <AppText className="text-4xl font-bold leading-tight text-fg">Læg et beløb</AppText>
        {wish ? <AppText className="text-xl leading-relaxed text-fg">{wish.title}</AppText> : null}
        {wish && typeof wish.priceOre === 'number' ? (
          <AppText className="text-xl font-semibold text-primary">{formatDKKWhole(wish.priceOre)}</AppText>
        ) : null}
      </View>


      <View className="h-10" />

      <View className="gap-3">
        <AppText className="text-2xl font-bold text-fg">Hvor meget lægger du?</AppText>
        {maxOre !== null ? (
          <AppText className="text-lg leading-relaxed text-fg">
            {already > 0
              ? `Der mangler ${formatDKKWhole(maxOre)} — andre har allerede lagt ${formatDKKWhole(already)}.`
              : `Højst ${formatDKKWhole(maxOre)}.`}
          </AppText>
        ) : null}
        <View className="flex-row flex-wrap items-center gap-3">
          <View style={{ width: 180 }}>
            <Input
              value={amount}
              onChangeText={setAmount}
              className="h-14 text-xl"
              placeholder="0"
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <AppText className="text-xl text-fg">kr.</AppText>
        </View>
        {tooMuch && maxOre !== null ? (
          <AppText className="text-lg font-semibold text-danger">
            Der mangler kun {formatDKKWhole(maxOre)}.
          </AppText>
        ) : null}
      </View>


      <View className="h-10" />

      <NameField value={name} onChangeText={setName} label="Hvem lægger pengene?" required />

      <View className="h-12" />

      <Button title="Læg beløbet" className="h-16" disabled={!canSave} loading={busy} onPress={save} />

      <View className="h-16" />
    </Screen>
  );
}
