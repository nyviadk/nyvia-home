import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { performWithUndo } from '@/lib/undo/perform-with-undo';
import { Pressable, View } from '@/tw';
import { deleteHome } from '../data/homes.repository';
import { markPendingHomeDelete, unmarkPendingHomeDelete } from '../data/pending-deletes';

/** Diskret slet m. bekræftelse + fortryd (optimistic + delayed). */
export function DeleteHomeLink({ id, label }: { id: string; label: string }) {
  async function onPress() {
    const ok = await confirmAction(
      'Slet bolig',
      `Vil du slette "${label}"? Flytte-data på boligen forbliver, men knyttes ikke længere til en synlig bolig.`,
      'Slet'
    );
    if (!ok) return;
    performWithUndo({
      message: `"${label}" slettet`,
      optimistic: () => {
        markPendingHomeDelete(id);
        router.back();
      },
      commit: async () => {
        await deleteHome(id);
        unmarkPendingHomeDelete(id);
      },
      revert: () => unmarkPendingHomeDelete(id),
    });
  }

  return (
    <View className="items-center pb-2 pt-8">
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText className="text-sm text-danger">Slet bolig</AppText>
      </Pressable>
    </View>
  );
}
