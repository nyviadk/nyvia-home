import type { Recurrence } from '@/lib/recurrence/types';

export type BudgetEntryType = 'income' | 'expense';

/** En fast budgetpost (forecast). Beløb i øre, altid positivt; fortegn følger `type`. */
export type BudgetEntry = {
  name: string;
  type: BudgetEntryType;
  amount: number;
  category: string;
  recurrence: Recurrence;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetEntryInput = Pick<
  BudgetEntry,
  'name' | 'type' | 'amount' | 'category' | 'recurrence' | 'note'
>;
