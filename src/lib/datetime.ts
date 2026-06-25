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

/** Konvertér et JS Date til ISO 8601. */
export function toISO(date: Date): string {
  return DateTime.fromJSDate(date).toISO()!;
}

/** Parse en ISO-streng til luxon DateTime i Copenhagen-tid. */
export function parseISO(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: APP_TIMEZONE });
}

/** Parse en ISO-streng til et JS Date (til date-pickers o.l.). */
export function isoToDate(iso: string): Date {
  return DateTime.fromISO(iso).toJSDate();
}

/** Formatér en ISO-dato i Copenhagen-tid, fx "25. jun. 2026". */
export function formatDateCopenhagen(iso: string): string {
  return parseISO(iso).setLocale('da').toFormat('d. MMM yyyy');
}

/** Formatér ISO-dato+tid i Copenhagen-tid, fx "25. jun. 2026 14:30". */
export function formatDateTimeCopenhagen(iso: string): string {
  return parseISO(iso).setLocale('da').toFormat('d. MMM yyyy HH:mm');
}

/** Kun måned+år, fx "juni 2026" (til budget-/lønseddel-overblik). */
export function formatMonthCopenhagen(iso: string): string {
  return parseISO(iso).setLocale('da').toFormat('LLLL yyyy');
}
