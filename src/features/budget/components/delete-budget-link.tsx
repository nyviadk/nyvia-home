import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { performWithUndo } from '@/lib/undo/perform-with-undo';
import { Pressable, View } from '@/tw';
import { deleteBudgetEntry } from '../data/budget.repository';
import { markPendingBudgetDelete, unmarkPendingBudgetDelete } from '../data/pending-deletes';

/** Diskret slet m. bekræftelse + fortryd (optimistic + delayed). */
export function DeleteBudgetLink({ id, name }: { id: string; name: string }) {
  async function onPress() {
    const ok = await confirmAction('Slet post', `Vil du slette "${name}"?`, 'Slet');
    if (!ok) return;
    performWithUndo({
      message: `"${name}" slettet`,
      optimistic: () => {
        markPendingBudgetDelete(id);
        router.back();
      },
      commit: async () => {
        await deleteBudgetEntry(id);
        unmarkPendingBudgetDelete(id);
      },
      revert: () => unmarkPendingBudgetDelete(id),
    });
  }

  return (
    <View className="items-center pb-2 pt-8">
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText className="text-sm text-danger">Slet post</AppText>
      </Pressable>
    </View>
  );
}
