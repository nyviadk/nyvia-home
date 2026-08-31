import { Image } from 'expo-image';
import { useState } from 'react';

import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture/pick-images';
import { storage } from '@/lib/firebase';
import { requireUid } from '@/lib/firebase/require-uid';
import { genId } from '@/lib/id';
import { notify } from '@/lib/toast/notify';
import { Pressable, View } from '@/tw';

/**
 * Portrættet til CV'ets hoved.
 *
 * Vælges fra telefonen eller maskinen og lægges i Storage — ikke et URL-felt. Man har
 * sjældent sit eget billede liggende på en adresse, og et felt der beder om en URL, kan
 * kun udfyldes af nogen der først har uploadet billedet et andet sted.
 *
 * Der gemmes en download-URL, ikke selve filen: den skal kunne hentes ind i print-HTML'en
 * uden at kende Storage.
 */
export function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const picked = await pickImages();
    if (!picked.length) return;
    setBusy(true);
    try {
      // Nyt filnavn hver gang: skrives der oven i det gamle, viser browserens cache stadig
      // det forrige billede — og så tror man at uploaden fejlede.
      const path = `users/${requireUid()}/cv/foto-${genId()}.jpg`;
      onChange(await storage.upload(path, picked[0].uri));
      // "Valgt", ikke "gemt": `onChange` sætter kun formularens state. Dokumentet skrives
      // først når man trykker Gem, og en toast der siger noget andet, er en løgn man
      // opdager næste gang skærmen åbnes.
      notify('Foto valgt — husk at gemme');
    } catch {
      // Uden denne blev en fejlet upload til en ubehandlet rejection: ingen besked, feltet
      // uændret, og man stod med et billede der så ud til bare ikke at ville vælges.
      notify('Kunne ikke uploade billedet — prøv igen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-2">
      {value ? (
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: value }}
            style={{ width: 88, height: 88, borderRadius: 6 }}
            contentFit="cover"
          />
          <View className="gap-1">
            <Pressable accessibilityRole="button" hitSlop={6} onPress={() => void pick()}>
              <AppText className="text-sm font-semibold text-primary">
                {busy ? 'Uploader…' : 'Skift billede'}
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="button" hitSlop={6} onPress={() => onChange('')}>
              <AppText className="text-sm text-danger">Fjern</AppText>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => void pick()}
          className="items-center justify-center rounded-xl border border-dashed border-border py-6 active:opacity-70"
          style={{ borderCurve: 'continuous' }}>
          <AppText className="text-sm font-semibold text-primary">
            {busy ? 'Uploader…' : '+ Vælg et billede'}
          </AppText>
          <AppText variant="muted" className="pt-1 text-xs">
            Vises kvadratisk i CV'ets hoved
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
