import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { Pressable, View } from '@/tw';
import { deleteLoan } from '../data/loans.repository';

/**
 * Diskret slet-handling: lille rød tekst (ikke en stor knap) + bekræftelse,
 * så et lån ikke slettes ved et uheld.
 */
export function DeleteLoanLink({ id, name }: { id: string; name: string }) {
  async function onPress() {
    const ok = await confirmAction(
      'Slet lån',
      `Vil du slette "${name}"? Det kan ikke fortrydes.`,
      'Slet'
    );
    if (!ok) return;
    await deleteLoan(id);
    router.back();
  }

  return (
    <View className="items-center pb-2 pt-8">
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText className="text-sm text-red-500">Slet lån</AppText>
      </Pressable>
    </View>
  );
}
