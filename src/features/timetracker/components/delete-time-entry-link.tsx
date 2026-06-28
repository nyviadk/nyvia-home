import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { performWithUndo } from '@/lib/undo/perform-with-undo';
import { Pressable, View } from '@/tw';
import { deleteTimeEntry } from '../data/timetracker.repository';
import { markPendingTimeDelete, unmarkPendingTimeDelete } from '../data/pending-deletes';

/** Diskret slet m. bekræftelse + fortryd (optimistic + delayed). */
export function DeleteTimeEntryLink({ id, label }: { id: string; label: string }) {
  async function onPress() {
    const ok = await confirmAction('Slet registrering', `Vil du slette "${label}"?`, 'Slet');
    if (!ok) return;
    performWithUndo({
      message: `"${label}" slettet`,
      optimistic: () => {
        markPendingTimeDelete(id);
        router.back();
      },
      commit: async () => {
        await deleteTimeEntry(id);
        unmarkPendingTimeDelete(id);
      },
      revert: () => unmarkPendingTimeDelete(id),
    });
  }

  return (
    <View className="items-center pb-2 pt-8">
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText className="text-sm text-danger">Slet registrering</AppText>
      </Pressable>
    </View>
  );
}
