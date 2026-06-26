import { showToast } from './toast-store';

/** Kort bekræftelses-toast (uden fortryd) til gemte handlinger. */
export function notify(message: string): void {
  showToast({ message, durationMs: 2500 });
}

/** Vis bekræftelse når en skrivning lykkes (og en fejl-toast hvis den fejler). */
export function toastAfter<T>(promise: Promise<T>, message: string): Promise<T> {
  promise.then(
    () => notify(message),
    () => notify('Kunne ikke gemme — prøv igen')
  );
  return promise;
}
