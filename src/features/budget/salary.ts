import BigNumber from 'bignumber.js';

import type { SalaryCalc } from './types';

export type SalaryBreakdown = {
  grossOre: number;
  amBidragOre: number;
  aSkatOre: number;
  netOre: number;
};

/**
 * Estimeret nettoløn (dansk standardmetode med trækprocent + månedsfradrag):
 *   AM-bidrag = brutto × am%
 *   A-skat    = (brutto − AM-bidrag − fradrag) × trækprocent   (min. 0)
 *   netto     = brutto − AM-bidrag − A-skat
 * Bevidst forenklet (ingen topskat/progression) — kun et estimat indtil rigtig løn kendes.
 */
export function salaryBreakdown(c: SalaryCalc): SalaryBreakdown {
  const gross = new BigNumber(c.grossOre);
  const amBidrag = gross.times(c.amBidragPct).div(100);
  const taxable = BigNumber.max(0, gross.minus(amBidrag).minus(c.fradragOre));
  const aSkat = taxable.times(c.traekPct).div(100);
  const net = gross.minus(amBidrag).minus(aSkat);
  const round = (b: BigNumber) => b.integerValue(BigNumber.ROUND_HALF_UP).toNumber();
  return {
    grossOre: round(gross),
    amBidragOre: round(amBidrag),
    aSkatOre: round(aSkat),
    netOre: round(net),
  };
}

export function estimatedNetOre(c: SalaryCalc): number {
  return salaryBreakdown(c).netOre;
}
