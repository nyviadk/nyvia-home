import BigNumber from 'bignumber.js';

/**
 * Penge gemmes ALTID som heltal i øre (int). Al beregning går gennem bignumber.js
 * for at undgå float-unøjagtighed (især ved decimaler og negative tal).
 */

const dkk = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dkkWhole = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Kroner (kan have decimaler) → øre (heltal). */
export function kronerToOre(kroner: BigNumber.Value): number {
  return new BigNumber(kroner).times(100).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}

/** Øre (heltal) → kroner som BigNumber (til videre beregning). */
export function oreToKroner(ore: BigNumber.Value): BigNumber {
  return new BigNumber(ore).div(100);
}

/** Formatér øre som dansk valuta, fx 4200000 → "42.000,00 kr." */
export function formatDKK(ore: number): string {
  return dkk.format(oreToKroner(ore).toNumber());
}

/** Formatér øre uden ører, fx 4200000 → "42.000 kr." */
export function formatDKKWhole(ore: number): string {
  return dkkWhole.format(oreToKroner(ore).toNumber());
}

/**
 * Parse brugerinput (dansk format med komma eller punktum) til øre.
 * Returnerer null hvis input ikke er et gyldigt tal.
 */
export function parseKronerInput(input: string): number | null {
  const cleaned = input
    .replace(/\s|kr\.?|DKK/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  if (cleaned === '') return null;
  const value = new BigNumber(cleaned);
  if (!value.isFinite()) return null;
  return value.times(100).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}
