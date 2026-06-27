import { z } from 'zod';

import { oreToKroner, parseKronerInput } from '@/lib/money';
import {
  defaultRecurrenceForm,
  fromRecurrence,
  recurrenceFormSchema,
  toRecurrence,
} from '@/lib/recurrence/recurrence-form';
import type { BudgetEntry, BudgetEntryInput } from '../types';

const moneyField = z.string().refine(
  (s) => {
    const ore = parseKronerInput(s);
    return ore !== null && ore >= 0;
  },
  { message: 'Beløb skal være et gyldigt tal' }
);

export const budgetFormSchema = z.object({
  name: z.string().trim().min(1, 'Navn kræves'),
  type: z.enum(['income', 'expense']),
  amount: moneyField,
  category: z.string().trim().min(1, 'Kategori kræves'),
  note: z.string().optional(),
  recurrence: recurrenceFormSchema,
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export function toBudgetFormValues(entry?: BudgetEntry): BudgetFormValues {
  if (!entry) {
    return {
      name: '',
      type: 'expense',
      amount: '',
      category: '',
      note: '',
      recurrence: defaultRecurrenceForm(),
    };
  }
  return {
    name: entry.name,
    type: entry.type,
    amount: String(oreToKroner(entry.amount).toNumber()),
    category: entry.category,
    note: entry.note ?? '',
    recurrence: fromRecurrence(entry.recurrence),
  };
}

export function toBudgetInput(values: BudgetFormValues): BudgetEntryInput {
  const note = values.note?.trim();
  return {
    name: values.name.trim(),
    type: values.type,
    amount: parseKronerInput(values.amount) ?? 0,
    category: values.category.trim(),
    recurrence: toRecurrence(values.recurrence),
    ...(note ? { note } : {}),
  };
}
