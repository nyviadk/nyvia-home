import { DateTime } from 'luxon';

/**
 * Datoer gemmes ALTID som ISO 8601-strenge. Tidszone-afhængig visning/logik
 * bruger Europe/Copenhagen. Aldrig naive lokale Date-antagelser (undgår
 * sommer/vintertid- og tidszone-bugs).
 */
export const APP_TIMEZONE = 'Europe/Copenhagen';

/** Nuværende tidspunkt som ISO 8601 (med offset). */
export function nowISO(): string {
  return DateTime.now().toISO()!;
}

/** Parse en ISO-streng til luxon DateTime i Copenhagen-tid. */
function parseISO(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: APP_TIMEZONE });
}

/** Formatér en ISO-dato i Copenhagen-tid, fx "25. jun. 2026". */
export function formatDateCopenhagen(iso: string): string {
  return parseISO(iso).setLocale('da').toFormat('d. MMM yyyy');
}

/** Formatér ISO-dato+tid i Copenhagen-tid, fx "25. jun. 2026 14:30". */
export function formatDateTimeCopenhagen(iso: string): string {
  return parseISO(iso).setLocale('da').toFormat('d. MMM yyyy HH:mm');
}

/**
 * Kun måned+år med stort begyndelsesbogstav, fx "Juni 2026". Luxon giver dansk måned i
 * små bogstaver, og hvert kaldested skrev før sin egen `capitalize` (fire kopier).
 */
export function formatMonthCopenhagen(iso: string): string {
  const s = parseISO(iso).setLocale('da').toFormat('LLLL yyyy');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Måneds-nøglen (ÅÅÅÅ-MM) for en ISO-dato. Erstatter det gentagne `.slice(0, 7)`. */
export function ym(iso: string): string {
  return iso.slice(0, 7);
}

/** Dagens dato i Copenhagen som ÅÅÅÅ-MM-DD (til dato-tekstfelter). */
export function todayISODate(): string {
  return DateTime.now().setZone(APP_TIMEZONE).toFormat('yyyy-MM-dd');
}
