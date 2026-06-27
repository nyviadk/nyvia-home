import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { performWithUndo } from '@/lib/undo/perform-with-undo';
import { Pressable, View } from '@/tw';
import { deleteSubscription } from '../data/subscriptions.repository';
import {
  markPendingSubscriptionDelete,
  unmarkPendingSubscriptionDelete,
} from '../data/pending-deletes';

/** Diskret slet m. bekræftelse + fortryd (optimistic + delayed). */
export function DeleteSubscriptionLink({ id, name }: { id: string; name: string }) {
  async function onPress() {
    const ok = await confirmAction('Slet abonnement', `Vil du slette "${name}"?`, 'Slet');
    if (!ok) return;
    performWithUndo({
      message: `"${name}" slettet`,
      optimistic: () => {
        markPendingSubscriptionDelete(id);
        router.back();
      },
      commit: async () => {
        await deleteSubscription(id);
        unmarkPendingSubscriptionDelete(id);
      },
      revert: () => unmarkPendingSubscriptionDelete(id),
    });
  }

  return (
    <View className="items-center pb-2 pt-8">
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText className="text-sm text-danger">Slet abonnement</AppText>
      </Pressable>
    </View>
  );
}
