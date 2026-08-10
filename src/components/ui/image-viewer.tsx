import { Image } from 'expo-image';
import { Modal } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';

/**
 * Ét billede i fuld skærm. Tryk hvor som helst lukker.
 *
 * Bruger IKKE `ModalSheet`: den centrerer et hvidt ark med padding, og et screenshot skal
 * fylde hele skærmen på mørk baggrund for at være læsbart. `contentFit="contain"` bevarer
 * proportionerne, så intet beskæres.
 */
export function ImageViewer({
  url,
  onClose,
}: {
  /** null = lukket. */
  url: string | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Luk billede"
        style={{ backgroundColor: 'rgba(20, 20, 19, 0.94)', cursor: 'auto' }}
        className="flex-1 items-center justify-center p-4">
        {url ? (
          <Image
            source={{ uri: url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        ) : null}
        <View className="absolute bottom-8 rounded-full bg-black/50 px-4 py-2">
          <AppText className="text-sm text-white">Tryk for at lukke</AppText>
        </View>
      </Pressable>
    </Modal>
  );
}
