import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useLoansStore } from '@/features/loans/data/loans-store';
import { loanStartMonth, monthlyOre, remainingOre } from '@/features/loans/loans.utils';
import { useSubscriptionsStore } from '@/features/subscriptions/data/subscriptions-store';
import { formatMonthCopenhagen } from '@/lib/datetime';
import { occursInMonth } from '@/lib/recurrence/engine';
import { loanPaymentForMonth } from '../forecast';
import { effectivePriceOre } from '../pricing';
import { formatDKKWhole } from '@/lib/money';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import { useBudgetSettingsStore } from '../data/budget-settings-store';
import { useMonthEntries, type MonthEntryRow } from '../hooks/use-month-entries';

function EntryRow({ row, ym }: { row: MonthEntryRow; ym: string }) {
  const hasActual = row.actualOre !== null;
  const effective = row.actualOre ?? row.forventetOre;
  // Effekt på rådighedsbeløbet: + = bedre (mindre udgift / mere indtægt), − = værre.
  const delta =
    row.type === 'income' ? effective - row.forventetOre : row.forventetOre - effective;
  const deltaLabel = `${delta >= 0 ? '+' : '−'}${formatDKKWhole(Math.abs(delta))}`;

  return (
    <Link href={{ pathname: '/budget/actuals', params: { id: row.id, ym } }} asChild>
      <Pressable
        accessibilityRole="button"
        className={cn(
          'flex-row items-center justify-between gap-3 py-2',
          hasActual
            ? 'my-0.5 rounded-xl border border-border bg-element px-3'
            : 'border-t border-border'
        )}>
        <View className="flex-1">
          <AppText variant="label">{row.name}</AppText>
          {hasActual ? (
            <View className="flex-row flex-wrap items-baseline gap-x-2">
              <AppText variant="muted">Forventet {formatDKKWhole(row.forventetOre)}</AppText>
              {delta !== 0 ? (
                <AppText className={cn('text-sm', delta > 0 ? 'text-success' : 'text-danger')}>
                  {deltaLabel}
                </AppText>
              ) : (
                <AppText variant="muted">som forventet</AppText>
              )}
            </View>
          ) : (
            <AppText variant="muted">
              forventet{row.categories.length ? ` · ${row.categories.join(', ')}` : ''}
            </AppText>
          )}
        </View>
        <View className="items-end">
          {hasActual ? <AppText variant="muted" className="text-xs">faktisk</AppText> : null}
          <MoneyText
            ore={effective}
            whole
            variant="label"
            className={cn(row.type === 'income' && 'text-accent-savings')}
          />
        </View>
      </Pressable>
    </Link>
  );
}

/** Detalje for én budgetmåned: forventet vs. faktisk pr. post (klik for at rette faktisk). */
export function BudgetMonthScreen({ ym }: { ym: string }) {
  const rows = useMonthEntries(ym);
  const loans = useLoansStore((s) => s.loans);
  const [year, month] = ym.split('-').map((n) => Number.parseInt(n, 10));
  const loanMonthly = loanPaymentForMonth(
    loans.map((l) => ({
      remainingOre: remainingOre(l),
      monthlyOre: monthlyOre(l),
      startMonth: loanStartMonth(l),
    })),
    year,
    month
  );

  // Aktive abonnementer der falder i måneden (samme grundlag som forecasten).
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const subRows = subscriptions
    .filter((s) => s.active && occursInMonth(s.recurrence, year, month))
    .map((s) => ({ id: s.id, name: s.name, amountOre: effectivePriceOre(s.amount, s.priceChanges, ym) }))
    .sort((a, b) => b.amountOre - a.amountOre);
  const subTotal = subRows.reduce((t, s) => t + s.amountOre, 0);

  const effectiveOf = (r: MonthEntryRow) => r.actualOre ?? r.forventetOre;
  const byAmountDesc = (a: MonthEntryRow, b: MonthEntryRow) => effectiveOf(b) - effectiveOf(a);
  const incomes = rows.filter((r) => r.type === 'income').sort(byAmountDesc);
  const expenses = rows.filter((r) => r.type === 'expense').sort(byAmountDesc);

  const savingsPercent = useBudgetSettingsStore((s) => s.savingsPercent);
  const savingsOverride = useBudgetSettingsStore((s) => s.savingsActuals[ym]);

  const sum = (list: MonthEntryRow[]) => list.reduce((t, r) => t + (r.actualOre ?? r.forventetOre), 0);
  const incomeTotal = sum(incomes);
  const expenseTotal = sum(expenses) + subTotal + loanMonthly;
  const baseNet = incomeTotal - expenseTotal;

  // Udgifter, abonnementer og lån i én liste sorteret høj → lav.
  type ExpenseItem =
    | { kind: 'budget'; key: string; amount: number; row: MonthEntryRow }
    | { kind: 'sub'; key: string; amount: number; id: string; name: string }
    | { kind: 'loan'; key: string; amount: number };
  const expenseItems: ExpenseItem[] = [
    ...expenses.map(
      (r): ExpenseItem => ({ kind: 'budget', key: r.id, amount: effectiveOf(r), row: r })
    ),
    ...subRows.map(
      (s): ExpenseItem => ({ kind: 'sub', key: `sub-${s.id}`, amount: s.amountOre, id: s.id, name: s.name })
    ),
    ...(loanMonthly > 0
      ? [{ kind: 'loan', key: 'loan', amount: loanMonthly } as ExpenseItem]
      : []),
  ].sort((a, b) => b.amount - a.amount);
  const plannedSavings =
    savingsPercent > 0 && baseNet > 0 ? Math.round((baseNet * savingsPercent) / 100) : 0;
  const savings = savingsOverride ?? plannedSavings;
  const net = baseNet - savings;

  return (
    <Screen>
      <AppText variant="title" className="capitalize">
        {formatMonthCopenhagen(`${ym}-01`)}
      </AppText>

      <Card className="gap-2">
        <View className="flex-row items-baseline justify-between">
          <AppText variant="muted">Indtægter</AppText>
          <MoneyText ore={incomeTotal} whole variant="label" />
        </View>
        <View className="flex-row items-baseline justify-between">
          <AppText variant="muted">Udgifter (inkl. lån + abo)</AppText>
          <MoneyText ore={expenseTotal} whole variant="label" />
        </View>
        {savingsPercent > 0 || savingsOverride !== undefined ? (
          <Link href={{ pathname: '/budget/savings', params: { ym } }} asChild>
            <Pressable accessibilityRole="button" className="flex-row items-baseline justify-between">
              <AppText variant="muted">
                Opsparing{savingsOverride !== undefined ? ' (faktisk)' : ` (${savingsPercent}%)`} ›
              </AppText>
              <MoneyText ore={savings} whole variant="label" />
            </Pressable>
          </Link>
        ) : null}
        <View className="flex-row items-baseline justify-between border-t border-border pt-2">
          <AppText variant="label">Rådighedsbeløb</AppText>
          <MoneyText ore={net} whole variant="label" className={cn(net < 0 && 'text-danger')} />
        </View>
      </Card>

      <Card className="gap-1">
        <AppText variant="heading">Indtægter</AppText>
        {incomes.length ? (
          incomes.map((r) => <EntryRow key={r.id} row={r} ym={ym} />)
        ) : (
          <AppText variant="muted">Ingen denne måned.</AppText>
        )}
      </Card>

      <Card className="gap-1">
        <AppText variant="heading">Udgifter</AppText>
        {expenseItems.map((item) => {
          if (item.kind === 'budget') return <EntryRow key={item.key} row={item.row} ym={ym} />;
          if (item.kind === 'sub')
            return (
              <Link
                key={item.key}
                href={{ pathname: '/subscriptions/[id]', params: { id: item.id } }}
                asChild>
                <Pressable
                  accessibilityRole="button"
                  className="flex-row items-center justify-between gap-3 border-t border-border py-2">
                  <View className="flex-1">
                    <AppText variant="label">{item.name}</AppText>
                    <AppText variant="muted">abonnement</AppText>
                  </View>
                  <MoneyText ore={item.amount} whole variant="label" />
                </Pressable>
              </Link>
            );
          return (
            <Link key={item.key} href="/loans" asChild>
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center justify-between gap-3 border-t border-border py-2">
                <View className="flex-1">
                  <AppText variant="label">Lån</AppText>
                  <AppText variant="muted">afbetalingsplan (read-only)</AppText>
                </View>
                <MoneyText ore={item.amount} whole variant="label" />
              </Pressable>
            </Link>
          );
        })}
        {expenseItems.length === 0 ? (
          <AppText variant="muted">Ingen denne måned.</AppText>
        ) : null}
      </Card>
    </Screen>
  );
}
