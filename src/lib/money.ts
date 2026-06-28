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

/** Undgå "-0" (og "-0,00"): hvis værdien afrunder til nul, returnér positivt 0. */
function normalizeZero(value: number, fractionDigits: number): number {
  return Number(value.toFixed(fractionDigits)) === 0 ? 0 : value;
}

/** Formatér øre som dansk valuta, fx 4200000 → "42.000,00 kr." */
export function formatDKK(ore: number): string {
  return dkk.format(normalizeZero(oreToKroner(ore).toNumber(), 2));
}

/** Formatér øre uden ører, fx 4200000 → "42.000 kr." */
export function formatDKKWhole(ore: number): string {
  return dkkWhole.format(normalizeZero(oreToKroner(ore).toNumber(), 0));
}

const dkkInput = new Intl.NumberFormat('da-DK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Øre → redigerbar dansk streng til input-felter: tusind-separator "." og komma som
 * decimal, fx 580000 → "5.800", 15295 → "152,95". Ingen "kr."-suffiks.
 */
export function oreToInput(ore: number): string {
  return dkkInput.format(normalizeZero(oreToKroner(ore).toNumber(), 2));
}

/**
 * Parse brugerinput (dansk format med komma eller punktum) til øre.
 * Returnerer null hvis input ikke er et gyldigt tal.
 */
export function parseKronerInput(input: string | null | undefined): number | null {
  if (typeof input !== 'string') return null;
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
