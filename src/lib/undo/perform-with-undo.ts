import { showToast, UNDO_DURATION_MS } from '@/lib/toast/toast-store';

export interface UndoableOptions {
  /** Besked i toasten. */
  message: string;
  /** Tekst på fortryd-knappen (default "Fortryd"). */
  undoLabel?: string;
  /** Hvor længe man kan nå at fortryde (default 7s). */
  durationMs?: number;
  /** Anvend UI-ændringen straks (optimistisk). */
  optimistic: () => void;
  /** Skriv til DB — kaldes FØRST når fortryd-vinduet udløber (ingen write hvis fortrudt). */
  commit: () => void | Promise<void>;
  /** Fortryd den optimistiske ændring. */
  revert: () => void;
}

/**
 * Fortryd for handlinger der IKKE kan udskydes — typisk en nulstilling, hvor brugeren
 * skal se effekten med det samme. Skrivningen sker nu; Fortryd kører en KOMPENSERENDE
 * skrivning der sætter de gamle værdier tilbage.
 *
 * Modsat `performWithUndo`, hvor fortryd betyder at skrivningen aldrig sker. Brug denne
 * når den gamle tilstand kan gendannes, og hin når handlingen kan vente.
 */
export function writeWithUndo(opts: {
  message: string;
  write: () => Promise<unknown>;
  restore: () => Promise<unknown>;
}): void {
  void opts.write();
  showToast({
    message: opts.message,
    actionLabel: 'Fortryd',
    durationMs: UNDO_DURATION_MS,
    onAction: () => void opts.restore(),
  });
}

/**
 * Generisk "gør med fortryd": optimistisk UI nu, udskudt DB-write, og fuld fortryd
 * inden for tidsvinduet (så fortrudte handlinger aldrig rammer databasen).
 * Ikke hardcoded — hver handling leverer optimistic/commit/revert.
 */
export function performWithUndo(opts: UndoableOptions): void {
  const duration = opts.durationMs ?? UNDO_DURATION_MS;
  let settled = false;

  opts.optimistic();

  const commitTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    void Promise.resolve(opts.commit());
  }, duration);

  showToast({
    message: opts.message,
    actionLabel: opts.undoLabel ?? 'Fortryd',
    durationMs: duration,
    onAction: () => {
      if (settled) return;
      settled = true;
      clearTimeout(commitTimer);
      opts.revert();
    },
  });
}
