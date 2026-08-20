import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import type { MealSlot } from './types';

/** Dagsnøgle i Europe/Copenhagen. Klokken 00:30 hører til den dag man synes det er. */
export const dayKey = (date: DateTime = DateTime.now()) =>
  date.setZone(APP_TIMEZONE).toFormat('yyyy-MM-dd');

/** De seneste `n` dage, ældste først — til uge-bjælkerne. */
export function recentDays(n: number): string[] {
  const today = DateTime.now().setZone(APP_TIMEZONE);
  return Array.from({ length: n }, (_, i) => dayKey(today.minus({ days: n - 1 - i })));
}

export const weekdayShort = (key: string) =>
  DateTime.fromISO(key, { zone: APP_TIMEZONE }).setLocale('da').toFormat('ccc');

export const dayLabel = (key: string) => {
  const d = DateTime.fromISO(key, { zone: APP_TIMEZONE });
  if (key === dayKey()) return 'I dag';
  if (key === dayKey(DateTime.now().minus({ days: 1 }))) return 'I går';
  return d.setLocale('da').toFormat('cccc d. MMM');
};

/**
 * Gættet på hvilket måltid klokken svarer til.
 *
 * Findes for at "ukendt måltid" kan være ÉT tryk. Skulle man vælge sektion hver gang, var
 * knappen ikke længere hurtigere end at oprette en ret, og så ville man lade være.
 */
export function currentMeal(now: DateTime = DateTime.now()): MealSlot {
  const h = now.setZone(APP_TIMEZONE).hour;
  if (h < 10) return 'morgen';
  if (h < 14) return 'frokost';
  if (h < 17) return 'snack';
  if (h < 22) return 'aften';
  return 'snack';
}
