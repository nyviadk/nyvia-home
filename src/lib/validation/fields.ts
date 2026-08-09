import { z } from 'zod';

import { parseKronerInput } from '@/lib/money';

/**
 * Delte zod-byggeklodser til formularerne. Lå før i tre-fire kopier pr. regel, hver med
 * sin egen danske fejltekst — så to felter med samme krav kunne give forskellig besked.
 */

/** Er strengen et gyldigt, ikke-negativt kronebeløb? */
export const isMoney = (s: string): boolean => {
  const ore = parseKronerInput(s);
  return ore !== null && ore >= 0;
};

/** Beløbs-tekstfelt. `label` gør fejlen konkret ("Ydelse skal være et gyldigt beløb"). */
export const moneyField = (label = 'Beløb') =>
  z.string().refine(isMoney, { message: `${label} skal være et gyldigt beløb` });

/** ÅÅÅÅ-MM-DD. */
export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** ÅÅÅÅ-MM eller ÅÅÅÅ-MM-DD — månedlige poster angiver kun måned. */
export const ISO_DAY_OR_MONTH = /^\d{4}-\d{2}(-\d{2})?$/;

/** Dato-tekstfelt på fuld dato-form. */
export const dateField = z.string().regex(ISO_DAY, 'Brug formatet ÅÅÅÅ-MM-DD');
