import { router } from 'expo-router';

import { AppText } from '@/components/ui/text';
import type { PendingDeletes } from '@/lib/db/pending-deletes';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { Pressable, View } from '@/tw';

/**
 * Slet-linket nederst på en detalje-skærm: bekræftelses-alert → optimistisk skjul +
 * `router.back()` → udskudt DB-write med Fortryd. Selve flowet ligger i `confirmDelete`,
 * så rækker i en liste kan bruge præcis samme regler uden at navigere væk.
 */
export function DeleteEntityLink({
  id,
  label,
  name,
  confirmMessage,
  pending,
  remove,
}: {
  id: string;
  /** Knap-tekst + dialog-titel, fx "Slet kunde". */
  label: string;
  /** Navn der vises i toast + standard-bekræftelse. */
  name: string;
  /** Valgfri ekstra forklaring i bekræftelses-dialogen. */
  confirmMessage?: string;
  /** Featurens pending-delete-store, så posten skjules mens fortryd-vinduet løber. */
  pending: PendingDeletes;
  remove: () => void | Promise<unknown>;
}) {
  return (
    <View className="items-center pb-2 pt-8">
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() =>
          void confirmDelete({
            title: label,
            name,
            message: confirmMessage,
            markPending: () => pending.mark(id),
            unmarkPending: () => pending.unmark(id),
            remove,
            after: router.back,
          })
        }>
        <AppText className="text-sm text-danger">{label}</AppText>
      </Pressable>
    </View>
  );
}
