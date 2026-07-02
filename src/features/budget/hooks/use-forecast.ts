import { useMemo } from 'react';

import { loanStartMonth, monthlyOre, remainingOre } from '@/features/loans/loans.utils';
import { useLoansStore } from '@/features/loans/data/loans-store';
import { useSubscriptionsStore } from '@/features/subscriptions/data/subscriptions-store';
import { useBudgetStore } from '../data/budget-store';
import { useBudgetSettingsStore } from '../data/budget-settings-store';
import { usePendingBudgetDeletes } from '../data/pending-deletes';
import type { ForecastInput, ForecastRule } from '../forecast';
import { subscriptionToRules } from '../subscription-rules';

/**
 * Samler forecast-input fra budget-poster (minus optimistisk slettede), aktive
 * abonnementer og lån-ydelser (live). Udledes under render — ingen effects.
 */
export function useForecastInput(): ForecastInput {
  const entries = useBudgetStore((s) => s.entries);
  const pending = usePendingBudgetDeletes((s) => s.ids);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const loans = useLoansStore((s) => s.loans);
  const savingsPercent = useBudgetSettingsStore((s) => s.savingsPercent);
  const savingsPercentChanges = useBudgetSettingsStore((s) => s.savingsPercentChanges);
  const savingsActuals = useBudgetSettingsStore((s) => s.savingsActuals);

  // Memoiseret: forecast-motoren er tung, og input skal være en STABIL reference, så
  // consumers (og deres useMemo) ikke genberegner ved hver render — kun når data ændres.
  return useMemo<ForecastInput>(() => {
    const visible = entries.filter((e) => !pending.has(e.id));

    const budgetRule = (e: (typeof visible)[number]): ForecastRule => ({
      amount: e.amount,
      recurrence: e.recurrence,
      advanceMonth: e.advanceMonth,
      priceChanges: e.priceChanges,
      actuals: e.actuals,
    });

    return {
      incomeRules: visible.filter((e) => e.type === 'income').map(budgetRule),
      expenseRules: [
        ...visible.filter((e) => e.type === 'expense').map(budgetRule),
        ...subscriptions.filter((s) => s.active).flatMap(subscriptionToRules),
      ],
      loans: loans.map((l) => ({
        remainingOre: remainingOre(l),
        monthlyOre: monthlyOre(l),
        startMonth: loanStartMonth(l),
      })),
      savingsPercent,
      savingsPercentChanges,
      savingsActuals,
    };
  }, [entries, pending, subscriptions, loans, savingsPercent, savingsPercentChanges, savingsActuals]);
}
