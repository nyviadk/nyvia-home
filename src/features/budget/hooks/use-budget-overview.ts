import { useMemo } from 'react';

import { useLoansStore } from '@/features/loans/data/loans-store';
import { totalCurrentMonthlyPayment } from '@/features/loans/loans.utils';
import { useSubscriptionsStore } from '@/features/subscriptions/data/subscriptions-store';
import { todayISODate } from '@/lib/datetime';
import { useBudgetStore } from '../data/budget-store';
import { useBudgetSettingsStore } from '../data/budget-settings-store';
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
  const entries = useBudgetStore.useVisibleItems();
  const subscriptions = useSubscriptionsStore.useVisibleItems();
  const loans = useLoansStore.useVisibleItems();
  const savingsPercent = useBudgetSettingsStore((s) => s.savingsPercent);
  const savingsPercentChanges = useBudgetSettingsStore((s) => s.savingsPercentChanges);
  const startDate = useBudgetSettingsStore((s) => s.startDate);

  return useMemo<BudgetOverview>(() => {
    // Overblikket viser "nu" → brug den gældende procent for indeværende måned.
    const currentPercent = effectiveSavingsPercent(
      savingsPercent,
      savingsPercentChanges,
      todayISODate().slice(0, 7)
    );

    return budgetOverview({
      incomeRules: entries.filter((e) => e.type === 'income').map(toRule),
      expenseRules: entries.filter((e) => e.type === 'expense').map(toRule),
      subscriptionRules: subscriptions.filter((s) => s.active).map(toRule),
      loansMonthlyOre: totalCurrentMonthlyPayment(loans),
      savingsPercent: currentPercent,
      anchorISO: forecastAnchorISO(startDate),
      count: 12,
    });
  }, [entries, subscriptions, loans, savingsPercent, savingsPercentChanges, startDate]);
}
