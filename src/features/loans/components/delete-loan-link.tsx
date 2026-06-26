import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { performWithUndo } from '@/lib/undo/perform-with-undo';
import { Pressable, View } from '@/tw';
import { deleteLoan } from '../data/loans.repository';
import { markPendingDelete, unmarkPendingDelete } from '../data/pending-deletes';

/**
 * Diskret slet-handling med optimistic + delayed execution: lånet forsvinder
 * straks og en toast m. "Fortryd" vises; først når vinduet udløber slettes det i
 * DB (fortryd → ingen write). Beskytter mod utilsigtet sletning uden ekstra dialog.
 */
export function DeleteLoanLink({ id, name }: { id: string; name: string }) {
  function onPress() {
    performWithUndo({
      message: `"${name}" slettet`,
      optimistic: () => {
        markPendingDelete(id);
        router.back();
      },
      commit: async () => {
        await deleteLoan(id);
        unmarkPendingDelete(id);
      },
      revert: () => unmarkPendingDelete(id),
    });
  }

  return (
    <View className="items-center pb-2 pt-8">
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText className="text-sm text-danger">Slet lån</AppText>
      </Pressable>
    </View>
  );
}
