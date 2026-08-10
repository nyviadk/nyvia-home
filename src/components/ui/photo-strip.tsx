import { Image } from 'expo-image';
import { useState } from 'react';

import { ImageViewer } from '@/components/ui/image-viewer';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';

/**
 * Række af billed-miniaturer. Tryk åbner billedet i fuld skærm.
 *
 * `onRemove` gør striben redigerbar (kryds på hvert billede) — så bruges tryk til at fjerne
 * i stedet for at åbne, fordi de to gestus ellers ville slås om det samme tryk.
 */
export function PhotoStrip({
  urls,
  size = 84,
  onRemove,
}: {
  urls: readonly string[];
  size?: number;
  /** Sat = redigerings-tilstand: tryk fjerner billedet i stedet for at åbne det. */
  onRemove?: (index: number) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (urls.length === 0) return null;

  return (
    <>
      <View className="flex-row flex-wrap gap-2">
        {urls.map((url, i) => (
          <Pressable
            key={`${url}-${i}`}
            accessibilityRole="button"
            accessibilityLabel={onRemove ? 'Fjern billede' : 'Vis billede'}
            onPress={() => (onRemove ? onRemove(i) : setOpen(url))}>
            <Image
              source={{ uri: url }}
              style={{ width: size, height: size, borderRadius: 8 }}
              contentFit="cover"
            />
            {onRemove ? (
              <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60">
                <AppText className="text-xs text-white">✕</AppText>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
      <ImageViewer url={open} onClose={() => setOpen(null)} />
    </>
  );
}
