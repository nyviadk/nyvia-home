import { confirmAction } from '@/lib/confirm';
import { performWithUndo } from '@/lib/undo/perform-with-undo';

/**
 * Projektets ENE slette-flow: bekræftelses-alert → optimistisk skjul → udskudt DB-write med
 * Fortryd. Fortryder man, sker skrivningen aldrig.
 *
 * Ren logik uden UI og uden navigation, så både detalje-skærme (som lukker sig selv bagefter
 * via `after`) og rækker i en liste (som bliver stående) kan bruge den. Gælder ALLE sletninger,
 * uanset hvor lille entiteten er — der er ikke længere en "for lille til at bekræfte"-kategori.
 */
export async function confirmDelete(opts: {
  /** Dialogens titel, fx 'Slet bolig'. */
  title: string;
  /** Navnet der vises i toasten, fx boligens adresse. */
  name: string;
  /** Brødtekst i dialogen. Default: `Vil du slette "<name>"?`. */
  message?: string;
  /** Tekst på bekræft-knappen. Default 'Slet'. */
  confirmLabel?: string;
  /** Toast-besked. Default: `"<name>" slettet`. */
  toast?: string;
  markPending: () => void;
  unmarkPending: () => void;
  remove: () => void | Promise<unknown>;
  /** Kaldes efter det optimistiske skjul — fx `router.back` på en detalje-skærm. */
  after?: () => void;
}): Promise<void> {
  const confirmLabel = opts.confirmLabel ?? 'Slet';
  const ok = await confirmAction(
    opts.title,
    opts.message ?? `Vil du slette "${opts.name}"?`,
    confirmLabel
  );
  if (!ok) return;

  performWithUndo({
    message: opts.toast ?? `"${opts.name}" slettet`,
    optimistic: () => {
      opts.markPending();
      opts.after?.();
    },
    commit: async () => {
      await opts.remove();
      opts.unmarkPending();
    },
    revert: () => opts.unmarkPending(),
  });
}
