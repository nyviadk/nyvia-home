import BigNumber from 'bignumber.js';

import type { ActualLine, PriceChange } from './types';

/** ÅÅÅÅ-MM for en forekomst (budgetmåned). */
export function ym(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Forventet pris for en given budgetmåned: seneste prisændring med fromYm <= ym,
 * ellers grundbeløbet. "Denne og fremover" påvirker altså ikke fortiden.
 */
export function effectivePriceOre(
  baseOre: number,
  priceChanges: PriceChange[] | undefined,
  monthYm: string
): number {
  if (!priceChanges || priceChanges.length === 0) return baseOre;
  const applicable = priceChanges
    .filter((p) => p.fromYm <= monthYm)
    .sort((a, b) => a.fromYm.localeCompare(b.fromYm));
  return applicable.length ? applicable[applicable.length - 1].amountOre : baseOre;
}

/** Summen af faktiske linjer for en måned, eller null hvis ingen er registreret. */
export function actualTotalOre(
  actuals: Record<string, ActualLine[]> | undefined,
  monthYm: string
): number | null {
  const lines = actuals?.[monthYm];
  if (!lines || lines.length === 0) return null;
  return lines.reduce((sum, l) => sum.plus(l.amountOre), new BigNumber(0)).toNumber();
}
