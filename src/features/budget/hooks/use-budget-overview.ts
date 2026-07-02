import { useMemo } from 'react';

import { useLoansStore } from '@/features/loans/data/loans-store';
import { totalMonthlyPayment } from '@/features/loans/loans.utils';
import { useSubscriptionsStore } from '@/features/subscriptions/data/subscriptions-store';
import { todayISODate } from '@/lib/datetime';
import { useBudgetStore } from '../data/budget-store';
import { useBudgetSettingsStore } from '../data/budget-settings-store';
import { usePendingBudgetDeletes } from '../data/pending-deletes';
import { forecastAnchorISO } from '../forecast';
import { budgetOverview, type BudgetOverview } from '../overview';
import { effectiveSavingsPercent } from '../pricing';
import type { BudgetEntry } from '../types';

const toRule = (e: { amount: number; recurrence: BudgetEntry['recurrence'] }) => ({
  amount: e.amount,
  recurrence: e.recurrence,
});

/** Udleder det gennemsnitlige månedlige overblik fra budget, abonnementer og lån (under render). */
export function useBudgetOverview(): BudgetOverview {
  const entries = useBudgetStore((s) => s.entries);
  const pending = usePendingBudgetDeletes((s) => s.ids);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const loans = useLoansStore((s) => s.loans);
  const savingsPercent = useBudgetSettingsStore((s) => s.savingsPercent);
  const savingsPercentChanges = useBudgetSettingsStore((s) => s.savingsPercentChanges);
  const startDate = useBudgetSettingsStore((s) => s.startDate);

  return useMemo<BudgetOverview>(() => {
    const visible = entries.filter((e) => !pending.has(e.id));
    // Overblikket viser "nu" → brug den gældende procent for indeværende måned.
    const currentPercent = effectiveSavingsPercent(
      savingsPercent,
      savingsPercentChanges,
      todayISODate().slice(0, 7)
    );

    return budgetOverview({
      incomeRules: visible.filter((e) => e.type === 'income').map(toRule),
      expenseRules: visible.filter((e) => e.type === 'expense').map(toRule),
      subscriptionRules: subscriptions.filter((s) => s.active).map(toRule),
      loansMonthlyOre: totalMonthlyPayment(loans),
      savingsPercent: currentPercent,
      anchorISO: forecastAnchorISO(startDate),
      count: 12,
    });
  }, [entries, pending, subscriptions, loans, savingsPercent, savingsPercentChanges, startDate]);
}
