import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, TextInput, View } from '@/tw';
import { NameField, namesFromField } from '../components/name-field';
import { addExtra, updateExtra } from '../data/wishlist-public.repository';
import { usePublicWishlist } from '../hooks/use-public-wishlist';
import type { WishlistExtra } from '../types';

/** Formular — monteres først når en evt. eksisterende post er hentet, så redigering prefiller. */
function ExtraForm({
  ownerUid,
  existing,
}: {
  ownerUid: string;
  existing?: WithId<WishlistExtra>;
}) {
  const router = useRouter();
  const isEdit = !!existing;

  const [text, setText] = useState(() => existing?.text ?? '');
  const [name, setName] = useState(() => (existing?.by ?? []).join(' & '));
  const [busy, setBusy] = useState(false);

  const canSave = text.trim().length > 0 && !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    const names = namesFromField(name);
    try {
      if (existing) await updateExtra(ownerUid, existing.id, text, names);
      else await addExtra(ownerUid, text, names);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="max-w-200 gap-0 p-6">
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.back()}
        className="self-start py-2">
        <AppText className="text-xl font-semibold text-primary">‹ Tilbage til listen</AppText>
      </Pressable>

      <View className="h-4" />

      <View className="gap-2">
        <AppText className="text-4xl font-bold leading-tight text-fg">
          {isEdit ? 'Redigér' : 'Købt uden for listen'}
        </AppText>
      </View>

      <View className="h-10" />

      <View className="gap-3">
        <AppText className="text-2xl font-bold text-fg">Hvad har du købt?</AppText>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          className="rounded-2xl border border-border bg-card px-4 py-3.5 text-xl text-fg"
          style={{ minHeight: 110, textAlignVertical: 'top', borderCurve: 'continuous' }}
        />
      </View>


      <View className="h-10" />

      <NameField value={name} onChangeText={setName} label="Hvem køber?" />

      <View className="h-12" />

      <Button
        title={isEdit ? 'Gem ændringer' : 'Tilføj'}
        className="h-16"
        disabled={!canSave}
        loading={busy}
        onPress={save}
      />

      <View className="h-16" />
    </Screen>
  );
}

/** "Købt uden for listen" som fuld skærm. */
export function ExtraScreen({ ownerUid, extraId }: { ownerUid: string; extraId?: string }) {
  const { extras, loading } = usePublicWishlist(ownerUid);
  const existing = extraId ? extras.find((e) => e.id === extraId) : undefined;

  // Vent på data ved redigering, ellers ville felterne starte tomme.
  if (extraId && !existing && loading) {
    return (
      <Screen className="max-w-200 p-6">
        <View />
      </Screen>
    );
  }

  return (
    <ExtraForm
      key={existing?.id ?? 'new'}
      ownerUid={ownerUid}
      existing={existing}
    />
  );
}
