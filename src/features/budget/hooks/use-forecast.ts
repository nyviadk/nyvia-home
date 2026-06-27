import { totalMonthlyPayment } from '@/features/loans/loans.utils';
import { useLoansStore } from '@/features/loans/data/loans-store';
import { useSubscriptionsStore } from '@/features/subscriptions/data/subscriptions-store';
import { useBudgetStore } from '../data/budget-store';
import { usePendingBudgetDeletes } from '../data/pending-deletes';
import type { ForecastInput, ForecastRule } from '../forecast';

/**
 * Samler forecast-input fra budget-poster (minus optimistisk slettede), aktive
 * abonnementer og lån-ydelser (live). Udledes under render — ingen effects.
 */
export function useForecastInput(): ForecastInput {
  const entries = useBudgetStore((s) => s.entries);
  const pending = usePendingBudgetDeletes((s) => s.ids);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const loans = useLoansStore((s) => s.loans);

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
      ...subscriptions
        .filter((s) => s.active)
        .map((s) => ({ amount: s.amount, recurrence: s.recurrence, priceChanges: s.priceChanges })),
    ],
    fixedMonthlyExpenseOre: totalMonthlyPayment(loans),
  };
}
