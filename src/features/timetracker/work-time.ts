import { parseHm } from './time.utils';
import type { TimeEntry } from './types';

type Entry = Pick<TimeEntry, 'date' | 'startTime' | 'endTime' | 'durationMinutes'>;

/**
 * De tre tal i oversigten.
 *
 * - `workMinutes` (arbejdstid): foreningen af alle intervaller — tid hvor MINDST én opgave
 *   kørte, talt én gang. Det fakturerbare tal.
 * - `taskMinutes` (opgavetid): summen af alle posters varighed, overlap talt med.
 * - `parallelism`: opgavetid / arbejdstid, eller null når arbejdstiden er 0.
 *
 * 11–12 udvikling + 11–12 hjemmeside + 11–11.15 administration = 60 min arbejdstid,
 * 135 min opgavetid, parallelitet 2,25.
 */
export type TimeTotals = { workMinutes: number; taskMinutes: number; parallelism: number | null };

const MIN_PER_DAY = 24 * 60;
const MS_PER_DAY = 86_400_000;

/** ÅÅÅÅ-MM-DD → dage siden epoken. UTC, så sommertid ikke flytter noget. */
function dayNumber(date: string): number | null {
  const ms = Date.parse(`${date}T00:00:00Z`);
  return Number.isNaN(ms) ? null : Math.round(ms / MS_PER_DAY);
}

/**
 * Arbejdstid = længden af foreningen af posternes intervaller.
 *
 * Intervallet er [dato + start, + varighed] på én fortløbende minut-akse, så natarbejde
 * (22:00→01:30) overlapper korrekt med en post næste morgen. Varigheden er den GEMTE
 * `durationMinutes` — samme kilde som opgavetiden, så arbejdstid ≤ opgavetid altid holder.
 *
 * Åbne poster (uden sluttid) har varighed 0 og bidrager ikke. En post med varighed, men
 * dato/start der ikke kan læses, tælles fuldt som sit eget interval i stedet for at falde
 * ud: den kan ikke placeres på tidslinjen, men tiden er logget og må ikke forsvinde.
 */
export function workMinutes(entries: readonly Entry[]): number {
  let unplaced = 0;
  const intervals: [number, number][] = [];
  for (const e of entries) {
    if (!e.endTime || e.durationMinutes <= 0) continue;
    const day = dayNumber(e.date);
    const start = parseHm(e.startTime);
    if (day === null || start === null) {
      unplaced += e.durationMinutes;
      continue;
    }
    const s = day * MIN_PER_DAY + start;
    intervals.push([s, s + e.durationMinutes]);
  }
  intervals.sort((a, b) => a[0] - b[0]);

  let total = 0;
  let cur: [number, number] | null = null;
  for (const [s, end] of intervals) {
    if (cur && s <= cur[1]) {
      cur[1] = Math.max(cur[1], end);
    } else {
      if (cur) total += cur[1] - cur[0];
      cur = [s, end];
    }
  }
  if (cur) total += cur[1] - cur[0];
  return total + unplaced;
}

export function timeTotals(entries: readonly Entry[]): TimeTotals {
  const work = workMinutes(entries);
  const task = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  return { workMinutes: work, taskMinutes: task, parallelism: work > 0 ? task / work : null };
}

const parallelismFormat = new Intl.NumberFormat('da-DK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 2.25 → "2,25×". */
export function formatParallelism(ratio: number): string {
  return `${parallelismFormat.format(ratio)}×`;
}
