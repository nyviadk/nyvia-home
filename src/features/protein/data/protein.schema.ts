import { z } from 'zod';

import type { ProteinFood, ProteinFoodInput, ProteinTag } from '../types';

/**
 * Feltet valideres som TEKST og konverteres først i `toFoodInput`.
 *
 * Fristelsen er at lade zod `.transform()` til et tal, men så bliver skemaets ind- og
 * ud-type forskellige, og react-hook-form kan ikke bruge samme type til defaultValues og
 * til resultatet. Validering og konvertering hører til hvert sit sted.
 */
const numberField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Udfyld ${label}`)
    .refine((v) => /^\d+([.,]\d+)?$/.test(v), 'Kun tal')
    .refine((v) => Number(v.replace(',', '.')) <= max, `${label} ser forkert ud`);

export const foodFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Giv retten et navn'),
    basis: z.enum(['per100g', 'portion']),
    proteinValue: numberField('protein', 200),
    kcalValue: numberField('kalorier', 2000),
    portionG: z.string().trim(),
    meal: z.enum(['morgen', 'frokost', 'aften', 'snack']),
  })
  .superRefine((v, ctx) => {
    // Portionsvægten er KUN krævet ved pr. 100 g — uden den kan portionen ikke udregnes.
    if (v.basis !== 'per100g') return;
    if (!/^\d+$/.test(v.portionG) || Number(v.portionG) <= 0) {
      ctx.addIssue({ code: 'custom', path: ['portionG'], message: 'Hvor mange gram er én portion?' });
    }
  });

export type FoodFormValues = z.infer<typeof foodFormSchema>;

export const parseNumber = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const num = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','));

export function toFoodFormValues(food?: ProteinFood): FoodFormValues {
  return {
    name: food?.name ?? '',
    basis: food?.basis ?? 'per100g',
    proteinValue: num(food?.proteinValue),
    kcalValue: num(food?.kcalValue),
    portionG: food?.portionG ? String(food.portionG) : '',
    meal: food?.meal ?? 'snack',
  };
}

export function toFoodInput(v: FoodFormValues, tags: ProteinTag[]): ProteinFoodInput {
  return {
    name: v.name.trim(),
    basis: v.basis,
    proteinValue: parseNumber(v.proteinValue),
    kcalValue: parseNumber(v.kcalValue),
    ...(v.basis === 'per100g' ? { portionG: parseNumber(v.portionG) } : {}),
    meal: v.meal,
    ...(tags.length ? { tags } : {}),
  };
}
