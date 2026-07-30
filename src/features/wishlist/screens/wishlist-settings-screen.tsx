import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useLiveDoc } from '@/lib/db/use-live-query';
import { View } from '@/tw';
import { saveWishlistSettings, subscribeWishlistSettings } from '../data/wishlist.repository';
import type { WishlistSettings } from '../types';

/** Selve formularen. Monteres først når dokumentet er hentet, så felterne starter udfyldt. */
function SettingsForm({ initial }: { initial: WishlistSettings | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveWishlistSettings({ title });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-3">
      <FormField label="Titel på listen">
        <Input value={title} onChangeText={setTitle} placeholder="Fx Ønskeliste til jul" />
      </FormField>

      <AppText variant="muted" className="text-xs">
        Står feltet tomt, hedder siden bare “Ønskeliste”.
      </AppText>

      <Button title="Gem" onPress={save} loading={busy} className="mt-2" />
    </View>
  );
}

/** Navn + titel som vises øverst på den delte side. */
export function WishlistSettingsScreen() {
  const { data, loading } = useLiveDoc<WishlistSettings>('wishlist-settings', (onChange, onError) =>
    subscribeWishlistSettings(onChange, onError),
  );

  return (
    <Screen>
      <AppText variant="title">Ønskeliste-indstillinger</AppText>
      <AppText variant="muted">Vises øverst på den side, du deler med andre.</AppText>
      {/* `key` frem for et "loaded"-flag: når dokumentet er hentet, monteres formularen med de
          rigtige startværdier i stedet for at blive rettet bagefter. */}
      {loading ? null : <SettingsForm key="loaded" initial={data} />}
    </Screen>
  );
}
