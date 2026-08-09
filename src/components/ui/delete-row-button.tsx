import { AppText } from '@/components/ui/text';
import type { PendingDeletes } from '@/lib/db/pending-deletes';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { Pressable } from '@/tw';

/**
 * Slet-knappen i en LISTE-række. Samme regler som `DeleteEntityLink` — bekræftelse først,
 * så optimistisk skjul med Fortryd — men uden `router.back()`, fordi rækken ligger på en
 * skærm man bliver på.
 *
 * Listen SKAL filtrere sin egen `pending`-store fra (`withoutPending`), ellers bliver
 * rækken stående under fortryd-vinduet og sletningen ser ud til at være mislykkedes.
 */
export function DeleteRowButton({
  id,
  title,
  name,
  confirmMessage,
  confirmLabel,
  label = 'Slet',
  pending,
  remove,
}: {
  id: string;
  /** Dialogens titel, fx 'Slet opgave'. */
  title: string;
  /** Navnet i dialog + toast. */
  name: string;
  confirmMessage?: string;
  confirmLabel?: string;
  /** Knap-teksten. Default 'Slet'. */
  label?: string;
  pending: PendingDeletes;
  remove: () => void | Promise<unknown>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={() =>
        void confirmDelete({
          title,
          name,
          message: confirmMessage,
          confirmLabel,
          markPending: () => pending.mark(id),
          unmarkPending: () => pending.unmark(id),
          remove,
        })
      }>
      <AppText className="text-sm text-danger">{label}</AppText>
    </Pressable>
  );
}
