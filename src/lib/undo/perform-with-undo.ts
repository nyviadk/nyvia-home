import { showToast } from '@/lib/toast/toast-store';

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
 * Generisk "gør med fortryd": optimistisk UI nu, udskudt DB-write, og fuld fortryd
 * inden for tidsvinduet (så fortrudte handlinger aldrig rammer databasen).
 * Ikke hardcoded — hver handling leverer optimistic/commit/revert.
 */
export function performWithUndo(opts: UndoableOptions): void {
  const duration = opts.durationMs ?? 7000;
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
