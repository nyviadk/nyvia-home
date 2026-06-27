import { useLoansStore } from '@/features/loans/data/loans-store';
import { totalMonthlyPayment } from '@/features/loans/loans.utils';
import { useSubscriptionsStore } from '@/features/subscriptions/data/subscriptions-store';
import type { WithId } from '@/lib/firebase';
import { useBudgetStore } from '../data/budget-store';
import { entryCategories } from '../data/categories';
import { usePendingBudgetDeletes } from '../data/pending-deletes';
import { budgetOverview, type BudgetOverview } from '../overview';
import type { BudgetEntry } from '../types';

/** Opsparing-poster matches på kategori, så de kan vises som egen linje. */
const SAVINGS_CATEGORY = 'opsparing';

const isSavings = (e: WithId<BudgetEntry>) =>
  entryCategories(e).some((c) => c.trim().toLowerCase() === SAVINGS_CATEGORY);
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

  const visible = entries.filter((e) => !pending.has(e.id));
  const expenses = visible.filter((e) => e.type === 'expense');

  return budgetOverview({
    incomeRules: visible.filter((e) => e.type === 'income').map(toRule),
    expenseRules: expenses.filter((e) => !isSavings(e)).map(toRule),
    savingsRules: expenses.filter(isSavings).map(toRule),
    subscriptionRules: subscriptions.filter((s) => s.active).map(toRule),
    loansMonthlyOre: totalMonthlyPayment(loans),
  });
}
