import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import { firstBankDayOfMonth, lastBankDayOfMonth, nextBankDay } from './danish-holidays';
import type { Recurrence } from './types';

// Cache pr. (år, måned) — samme måned bygges mange gange under ét forecast; zoned luxon-
// allokeringer er dyre på Hermes (Android).
const monthStartCache = new Map<number, DateTime>();
function monthStart(year: number, month: number): DateTime {
  const key = year * 100 + month;
  let d = monthStartCache.get(key);
  if (!d) {
    d = DateTime.fromObject({ year, month, day: 1 }, { zone: APP_TIMEZONE });
    monthStartCache.set(key, d);
  }
  return d;
}

// Cache parsede startdatoer (normaliseret til dagens start). De samme ~få startdatoer parses
// ellers tusindvis af gange, og zoned ISO-parsing er en af de dyreste luxon-operationer.
const startIsoCache = new Map<string, DateTime>();
function parseStartISO(iso: string): DateTime {
  let d = startIsoCache.get(iso);
  if (!d) {
    d = DateTime.fromISO(iso, { zone: APP_TIMEZONE }).startOf('day');
    startIsoCache.set(iso, d);
  }
  return d;
}

/** Rammer cadencen den givne måned (uden slut-grænse)? Start tjekkes på måneds-niveau. */
function matchesCadenceInMonth(rule: Recurrence, year: number, month: number): boolean {
  const start = parseStartISO(rule.startDate);
  // Måneds-aritmetik i stedet for luxon-diff/-sammenligning (langt hurtigere på Hermes).
  if (year < start.year || (year === start.year && month < start.month)) return false;
  const diff = (year - start.year) * 12 + (month - start.month);
  switch (rule.cadence) {
    case 'once':
      return diff === 0;
    case 'monthly':
      return true;
    case 'quarterly':
      return diff % 3 === 0;
    case 'half_yearly':
      return diff % 6 === 0;
    case 'yearly':
      return diff % 12 === 0;
    case 'biennial':
      return diff % 24 === 0;
    case 'triennial':
      return diff % 36 === 0;
  }
}

/**
 * Forekomstens faktiske (bank-justerede) dato i måneden, eller null for 'month'-dag
 * (ingen bestemt dato). Antager at cadencen rammer måneden.
 */
/**
 * Forekomstens NOMINELLE dato i måneden (den tilsigtede dag), eller null for 'month'-dag.
 * Bruges til måneds-tilhør (start/slut-grænser). Retningen på bankdag-justering er ligegyldig
 * for beregningerne — posten havner i samme måned via den nominelle dag uanset.
 * 'lastBank'/'firstBank' er allerede bankdage; faste dage/anker er den rå dag.
 */
function nominalOccurrenceDay(rule: Recurrence, year: number, month: number): DateTime | null {
  const start = parseStartISO(rule.startDate);
  const base = monthStart(year, month);
  const daysInMonth = base.daysInMonth ?? 28;
  if (rule.cadence === 'monthly') {
    const md = rule.monthlyDay ?? start.day;
    if (md === 'month') return null; // ingen bestemt dag (kun måneden tæller)
    if (md === 'lastBank') return lastBankDayOfMonth(year, month);
    if (md === 'firstBank') return firstBankDayOfMonth(year, month);
    return base.set({ day: Math.min(md, daysInMonth) });
  }
  // kvartal/halvår/år/engang: brug ankerdatoens dag-i-måneden
  return base.set({ day: Math.min(start.day, daysInMonth) });
}

/**
 * Forekomstens FAKTISKE (bank-justerede) dato — kun til VISNING. En fast dag på en lukkedag
 * rykkes til NÆSTE bankdag (førstkommende hverdag); 'lastBank' er allerede sidste bankdag,
 * så nextBankDay er da et no-op. Beregningerne bruger den nominelle dato, ikke denne.
 */
function occurrenceDayInMonth(rule: Recurrence, year: number, month: number): DateTime | null {
  const nominal = nominalOccurrenceDay(rule, year, month);
  return nominal ? nextBankDay(nominal) : null;
}

/**
 * Falder reglen i den givne måned? Start-/slut-grænsen tjekkes mod forekomstens NOMINELLE
 * dato (den tilsigtede dag), så måneds-tilhør er uafhængig af bankdag-justering: fx en årlig
 * post 1. jan. hører til JANUAR, selvom betalingen (nytårsdag lukket) reelt sker 4. jan.
 * 'month'-dag (ingen bestemt dato) bruger måneds-grænsen.
 */
export function occursInMonth(rule: Recurrence, year: number, month: number): boolean {
  if (!matchesCadenceInMonth(rule, year, month)) return false;
  const nominal = nominalOccurrenceDay(rule, year, month);
  if (nominal) {
    const start = parseStartISO(rule.startDate);
    if (nominal < start) return false;
    if (rule.endDate) {
      const end = DateTime.fromISO(rule.endDate, { zone: APP_TIMEZONE }).endOf('day');
      if (nominal > end) return false;
    }
    return true;
  }
  if (rule.endDate) {
    const end = DateTime.fromISO(rule.endDate, { zone: APP_TIMEZONE }).endOf('month');
    if (monthStart(year, month) > end) return false;
  }
  return true;
}

/** Den konkrete (bank-justerede) dato reglen falder på i måneden (ÅÅÅÅ-MM-DD), eller null. */
export function occurrenceDate(rule: Recurrence, year: number, month: number): string | null {
  if (!occursInMonth(rule, year, month)) return null;
  const occ = occurrenceDayInMonth(rule, year, month);
  return occ ? occ.toFormat('yyyy-MM-dd') : null;
}

/** Forekomster pr. år for en cadence (engang = 0 → indgår ikke i månedsgennemsnit). */
function occurrencesPerYear(cadence: Recurrence['cadence']): number {
  switch (cadence) {
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'half_yearly':
      return 2;
    case 'yearly':
      return 1;
    case 'biennial':
      return 0.5;
    case 'triennial':
      return 1 / 3;
    case 'once':
      return 0;
  }
}

/** Gennemsnitligt månedligt bidrag (øre): forekomster pr. år ÷ 12. Ser IKKE på start/slut
 *  → brug kun til per-måned-udjævning sammen med `isActiveInMonth`. */
export function monthlyAverageOre(amountOre: number, rule: Recurrence): number {
  return new BigNumber(amountOre)
    .times(occurrencesPerYear(rule.cadence))
    .div(12)
    .integerValue(BigNumber.ROUND_HALF_UP)
    .toNumber();
}

/** Er reglen aktiv i måneden? — til udjævnet ("hensat") visning. Månedlige poster bruger
 *  den præcise per-forekomst-logik (så en betaling efter slutdatoen heller ikke tæller her);
 *  periodiske poster udjævnes over hele det aktive vindue [start-måned, slut-måned]. */
export function isActiveInMonth(rule: Recurrence, year: number, month: number): boolean {
  if (rule.cadence === 'monthly') return occursInMonth(rule, year, month);
  const start = DateTime.fromISO(rule.startDate, { zone: APP_TIMEZONE });
  const target = monthStart(year, month);
  if (target < start.startOf('month')) return false;
  if (rule.endDate) {
    const end = DateTime.fromISO(rule.endDate, { zone: APP_TIMEZONE }).endOf('month');
    if (target > end) return false;
  }
  return true;
}

/** Cadencens periode i måneder — til horisont-udvidelse så sjældne cadencer udjævnes korrekt. */
function periodMonths(cadence: Recurrence['cadence']): number {
  switch (cadence) {
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'half_yearly':
      return 6;
    case 'yearly':
      return 12;
    case 'biennial':
      return 24;
    case 'triennial':
      return 36;
    case 'once':
      return 0;
  }
}

/**
 * Gennemsnitligt månedligt bidrag (øre) over en horisont fra `anchorISO` — tæller de
 * forekomster der FAKTISK falder (respekterer start/slut). Horisonten udvides til mindst
 * cadencens periode, så biennial/triennial udjævnes korrekt. Engangsbeløb → 0.
 */
export function averageMonthlyOre(
  amountOre: number,
  rule: Recurrence,
  anchorISO: string,
  count: number,
): number {
  if (rule.cadence === 'once') return 0; // engangsbeløb har ingen månedlig sats
  // Udvid horisonten til mindst cadencens periode, så sjældne cadencer (biennial 24 mdr,
  // triennial 36 mdr) fanger præcis én forekomst → korrekt beløb/24 hhv. beløb/36 i stedet
  // for at hoppe mellem beløb/12 og 0. ≤årlige poster er upåvirkede (periode ≤ 12).
  const horizon = Math.max(count, periodMonths(rule.cadence));
  const base = DateTime.fromISO(anchorISO, { zone: APP_TIMEZONE }).startOf('month');
  let occurrences = 0;
  for (let i = 0; i < horizon; i++) {
    const d = base.plus({ months: i });
    if (occursInMonth(rule, d.year, d.month)) occurrences++;
  }
  return new BigNumber(amountOre)
    .times(occurrences)
    .div(horizon)
    .integerValue(BigNumber.ROUND_HALF_UP)
    .toNumber();
}

/**
 * Har reglen mindst én forekomst i horisonten fra `anchorISO` (mindst cadencens periode lang)?
 * Bruges til "hensat"-forudhensættelse: en periodisk post må kun spredes jævnt ud over vinduet
 * hvis den faktisk forfalder i det — så poster der først starter langt ude ikke hensættes for tidligt.
 */
export function occursWithinHorizon(rule: Recurrence, anchorISO: string, count: number): boolean {
  const horizon = Math.max(count, periodMonths(rule.cadence));
  const base = DateTime.fromISO(anchorISO, { zone: APP_TIMEZONE }).startOf('month');
  for (let i = 0; i < horizon; i++) {
    const d = base.plus({ months: i });
    if (occursInMonth(rule, d.year, d.month)) return true;
  }
  return false;
}
