import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { performWithUndo } from '@/lib/undo/perform-with-undo';
import { Pressable, View } from '@/tw';

/**
 * Delt slet-handling for "store" entiteter (kunde, lån, bolig, abonnement, budgetpost):
 * bekræftelses-alert FØR sletning → optimistisk skjul + router.back → udskudt DB-write med
 * Fortryd (fortryd → ingen write). Små enkelt-ting bruger ikke denne (de har typisk kun undo).
 */
export function DeleteEntityLink({
  label,
  name,
  confirmMessage,
  markPending,
  unmarkPending,
  remove,
}: {
  /** Knap-tekst + dialog-titel, fx "Slet kunde". */
  label: string;
  /** Navn der vises i toast + standard-bekræftelse. */
  name: string;
  /** Valgfri ekstra forklaring i bekræftelses-dialogen. */
  confirmMessage?: string;
  markPending: () => void;
  unmarkPending: () => void;
  remove: () => void | Promise<unknown>;
}) {
  async function onPress() {
    const ok = await confirmAction(label, confirmMessage ?? `Vil du slette "${name}"?`, 'Slet');
    if (!ok) return;
    performWithUndo({
      message: `"${name}" slettet`,
      optimistic: () => {
        markPending();
        router.back();
      },
      commit: async () => {
        await remove();
        unmarkPending();
      },
      revert: () => unmarkPending(),
    });
  }

  return (
    <View className="items-center pb-2 pt-8">
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <AppText className="text-sm text-danger">{label}</AppText>
      </Pressable>
    </View>
  );
}
