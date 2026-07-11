import { dismissToast, showToast } from './toast-store';

/** Kort bekræftelses-toast (uden fortryd) til gemte handlinger. */
export function notify(message: string): void {
  showToast({ message, durationMs: 2500 });
}

let savedToastId: string | null = null;

/**
 * "Gemt"-toast til løbende gem: refresher ÉN toast i stedet for at stable en bunke ved
 * hurtige på-hinanden-følgende gemninger. Hænger lidt (3s), så den ikke forsvinder for hurtigt.
 */
export function notifySaved(message = 'Gemt'): void {
  if (savedToastId) dismissToast(savedToastId);
  savedToastId = showToast({ message, durationMs: 3000 });
}

/** Vis bekræftelse når en skrivning lykkes (og en fejl-toast hvis den fejler). */
export function toastAfter<T>(promise: Promise<T>, message: string): Promise<T> {
  promise.then(
    () => notify(message),
    () => notify('Kunne ikke gemme — prøv igen')
  );
  return promise;
}
