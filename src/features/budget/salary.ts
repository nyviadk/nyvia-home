import BigNumber from "bignumber.js";

import type { SalaryCalc } from "./types";

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
  const round = (b: BigNumber) =>
    b.integerValue(BigNumber.ROUND_HALF_UP).toNumber();

  const gross = new BigNumber(c.grossOre);

  // Beregn og rund AM-bidrag med det samme for at undgå afrundingsdifferencer på skærmen
  const amBidragCalc = gross.times(c.amBidragPct).div(100);
  const amBidragOre = round(amBidragCalc);

  // Beregn A-skattegrundlag baseret på det afrundede AM-bidrag
  const grossAfterAm = gross.minus(amBidragOre);
  const taxable = BigNumber.max(0, grossAfterAm.minus(c.fradragOre));

  // Beregn og rund A-skat
  const aSkatCalc = taxable.times(c.traekPct).div(100);
  const aSkatOre = round(aSkatCalc);

  // Beregn nettoløn ud fra de endelige, afrundede poster.
  // Dette sikrer, at grossOre - amBidragOre - aSkatOre altid giver præcis netOre.
  const netOre = gross.toNumber() - amBidragOre - aSkatOre;

  return {
    grossOre: gross.toNumber(),
    amBidragOre,
    aSkatOre,
    netOre,
  };
}

export function estimatedNetOre(c: SalaryCalc): number {
  return salaryBreakdown(c).netOre;
}
