import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { occursInMonth } from '@/lib/recurrence/engine';
import { useBudgetStore } from '../data/budget-store';
import { entryCategories } from '../data/categories';
import { usePendingBudgetDeletes } from '../data/pending-deletes';
import { actualTotalOre, effectivePriceOre } from '../pricing';
import type { BudgetEntry, BudgetEntryType } from '../types';

export type MonthEntryRow = {
  id: string;
  name: string;
  type: BudgetEntryType;
  categories: string[];
  forventetOre: number;
  actualOre: number | null;
};

/** Budget-poster der bidrager til en given måned (ÅÅÅÅ-MM), med forventet + faktisk. */
export function useMonthEntries(monthYm: string): MonthEntryRow[] {
  const entries = useBudgetStore((s) => s.entries);
  const pending = usePendingBudgetDeletes((s) => s.ids);

  const [year, month] = monthYm.split('-').map((n) => Number.parseInt(n, 10));
  const prev = DateTime.fromObject({ year, month }, { zone: APP_TIMEZONE }).minus({ months: 1 });

  const contributes = (e: WithId<BudgetEntry>) =>
    e.advanceMonth && e.type === 'income'
      ? occursInMonth(e.recurrence, prev.year, prev.month)
      : occursInMonth(e.recurrence, year, month);

  return entries
    .filter((e) => !pending.has(e.id))
    .filter(contributes)
    .map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      categories: entryCategories(e),
      forventetOre: effectivePriceOre(e.amount, e.priceChanges, monthYm),
      actualOre: actualTotalOre(e.actuals, monthYm),
    }));
}
