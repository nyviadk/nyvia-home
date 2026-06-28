import type { ScrubColumn, ScrubRule } from '../types';

/**
 * Anvender brugerens rense-regler på ét felt: hvis værdien indeholder reglens
 * `contains` (case-insensitivt), erstattes HELE feltet med `replaceWith`. Flere
 * regler på samme kolonne anvendes i rækkefølge. Null-værdier røres ikke.
 */
export function applyScrub(
  value: string | null,
  rules: readonly ScrubRule[],
  column: ScrubColumn
): string | null {
  if (value == null) return value;
  let out = value;
  for (const rule of rules) {
    if (rule.column !== column || !rule.contains) continue;
    if (out.toLowerCase().includes(rule.contains.toLowerCase())) {
      out = rule.replaceWith;
    }
  }
  return out;
}
