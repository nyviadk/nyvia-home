import type { UvSnapshot } from './types';

/**
 * Web-stub. UV-varsler er bevidst KUN native, og vi importerer derfor slet ikke
 * `expo-notifications` på web — så dens push-token-listener (og advarslen
 * "Listening to push token changes is not yet fully supported on web") aldrig opstår.
 * Bonus: pakken ryger helt ud af web-bundtet.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function cancelUvAlerts(_ids: string[]): Promise<void> {
  // ingen varsler på web
}

export async function scheduleUvAlerts(
  _snapshot: UvSnapshot,
  _previousIds: string[],
): Promise<string[]> {
  return [];
}
