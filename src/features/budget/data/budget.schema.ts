import { z } from 'zod';

import { oreToKroner, parseKronerInput } from '@/lib/money';
import {
  defaultRecurrenceForm,
  fromRecurrence,
  normalizeDateInput,
  recurrenceFormSchema,
  toRecurrence,
} from '@/lib/recurrence/recurrence-form';
import { estimatedNetOre } from '../salary';
import type { BudgetEntry, BudgetEntryInput, SalaryCalc } from '../types';
import { entryCategories } from './categories';
import { useBudgetSettingsStore } from './budget-settings-store';
import { defaultStartDate, effectiveStartMin } from './budget-start';

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

function parsePct(input: string): number | null {
  const n = Number.parseFloat(input.replace(',', '.').trim());
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

const isMoney = (s: string) => {
  const ore = parseKronerInput(s);
  return ore !== null && ore >= 0;
};

export const budgetFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Navn kræves'),
    type: z.enum(['income', 'expense']),
    /** 'net' = efter skat (beløb tastes direkte); 'gross' = før skat (løn-beregner). */
    amountMode: z.enum(['net', 'gross']),
    amount: z.string(),
    gross: z.string(),
    amBidragPct: z.string(),
    fradrag: z.string(),
    traekPct: z.string(),
    categories: z.array(z.string().trim().min(1)).min(1, 'Vælg mindst én kategori'),
    advanceMonth: z.boolean(),
    note: z.string().optional(),
    recurrence: recurrenceFormSchema,
  })
  .superRefine((values, ctx) => {
    const usesCalc = values.type === 'income' && values.amountMode === 'gross';

    if (usesCalc) {
      if (!isMoney(values.gross))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gross'], message: 'Bruttoløn skal være et gyldigt tal' });
      if (values.fradrag.trim() !== '' && !isMoney(values.fradrag))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fradrag'], message: 'Fradrag skal være et gyldigt tal' });
      if (parsePct(values.amBidragPct) === null)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amBidragPct'], message: '0–100' });
      if (parsePct(values.traekPct) === null)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['traekPct'], message: '0–100' });
    } else if (!isMoney(values.amount)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Beløb skal være et gyldigt tal' });
    }

    // Startdatoen kan ikke ligge før budgettets start. Forudbetalte indtægter (forudløn)
    // må dog starte måneden før, da pengene udbetales i forvejen.
    const advance = values.type === 'income' && values.advanceMonth;
    const min = effectiveStartMin(useBudgetSettingsStore.getState().startDate, advance);
    const start = normalizeDateInput(values.recurrence.startDate);
    if (min && ISO_DATE.test(values.recurrence.startDate) && start < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recurrence', 'startDate'],
        message: `Kan ikke være før budgettets start (${min})`,
      });
    }
  });

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

function salaryCalcFrom(values: BudgetFormValues): SalaryCalc {
  return {
    grossOre: parseKronerInput(values.gross) ?? 0,
    amBidragPct: parsePct(values.amBidragPct) ?? 0,
    fradragOre: parseKronerInput(values.fradrag) ?? 0,
    traekPct: parsePct(values.traekPct) ?? 0,
  };
}

export function toBudgetFormValues(entry?: BudgetEntry, budgetStart: string | null = null): BudgetFormValues {
  if (!entry) {
    return {
      name: '',
      type: 'expense',
      amountMode: 'net',
      amount: '',
      gross: '',
      amBidragPct: '8',
      fradrag: '',
      traekPct: '',
      categories: [],
      advanceMonth: false,
      note: '',
      recurrence: defaultRecurrenceForm(defaultStartDate(budgetStart)),
    };
  }
  const calc = entry.salaryCalc;
  return {
    name: entry.name,
    type: entry.type,
    amountMode: calc ? 'gross' : 'net',
    amount: String(oreToKroner(entry.amount).toNumber()),
    gross: calc ? String(oreToKroner(calc.grossOre).toNumber()) : '',
    amBidragPct: calc ? String(calc.amBidragPct) : '8',
    fradrag: calc ? String(oreToKroner(calc.fradragOre).toNumber()) : '',
    traekPct: calc ? String(calc.traekPct) : '',
    categories: entryCategories(entry),
    advanceMonth: entry.advanceMonth ?? false,
    note: entry.note ?? '',
    recurrence: fromRecurrence(entry.recurrence),
  };
}

export function toBudgetInput(values: BudgetFormValues): BudgetEntryInput {
  const note = values.note?.trim();
  const advance = values.type === 'income' && values.advanceMonth;
  const usesCalc = values.type === 'income' && values.amountMode === 'gross';
  const salaryCalc = usesCalc ? salaryCalcFrom(values) : undefined;
  const amount = salaryCalc ? estimatedNetOre(salaryCalc) : parseKronerInput(values.amount) ?? 0;

  return {
    name: values.name.trim(),
    type: values.type,
    amount,
    categories: values.categories.map((c) => c.trim()).filter(Boolean),
    recurrence: toRecurrence(values.recurrence),
    ...(advance ? { advanceMonth: true } : {}),
    ...(salaryCalc ? { salaryCalc } : {}),
    ...(note ? { note } : {}),
  };
}
