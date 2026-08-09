import { create } from 'zustand';

import { genId } from '@/lib/id';

interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
}

/**
 * Fortryd-vinduet: hvor længe toasten står, OG hvor længe DB-skrivningen udskydes.
 * De to SKAL være samme tal — forsvinder toasten før skrivningen sker, står brugeren
 * med en handling der ikke længere kan fortrydes uden at det fremgår nogen steder.
 */
export const UNDO_DURATION_MS = 7000;

export const useToastStore = create<ToastState>(() => ({ toasts: [] }));

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function showToast(opts: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}): string {
  const id = genId();
  const durationMs = opts.durationMs ?? UNDO_DURATION_MS;
  useToastStore.setState((s) => ({
    toasts: [...s.toasts, { id, message: opts.message, actionLabel: opts.actionLabel, onAction: opts.onAction, durationMs }],
  }));
  timers.set(
    id,
    setTimeout(() => dismissToast(id), durationMs)
  );
  return id;
}

export function dismissToast(id: string): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  useToastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}
