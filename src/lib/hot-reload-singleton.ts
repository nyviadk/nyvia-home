/**
 * Registrér et module-init-abonnement, der ikke leaker ved Fast Refresh.
 * Ved hot reload kaldes den forrige cleanup før der abonneres på ny, så vi ikke
 * ophober Firestore-listeners under udvikling. I produktion kører det blot én gang.
 */
export function hotReloadSubscribe(key: string, subscribe: () => () => void): void {
  const globalStore = globalThis as Record<string, unknown>;
  const previousCleanup = globalStore[key];
  if (typeof previousCleanup === 'function') {
    (previousCleanup as () => void)();
  }
  globalStore[key] = subscribe();
}
