/**
 * Penge gemmes ALTID som heltal i øre (int) for at undgå float-fejl.
 * Vises formateret i da-DK.
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
export function kronerToOre(kroner: number): number {
  return Math.round(kroner * 100);
}

/** Øre (heltal) → kroner (decimaltal). */
export function oreToKroner(ore: number): number {
  return ore / 100;
}

/** Formatér øre som dansk valuta, fx 4200000 → "42.000,00 kr." */
export function formatDKK(ore: number): string {
  return dkk.format(oreToKroner(ore));
}

/** Formatér øre uden ører, fx 4200000 → "42.000 kr." */
export function formatDKKWhole(ore: number): string {
  return dkkWhole.format(oreToKroner(ore));
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
  const value = Number(cleaned);
  return Number.isFinite(value) ? kronerToOre(value) : null;
}
