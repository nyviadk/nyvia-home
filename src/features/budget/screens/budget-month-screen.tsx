import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useLoansStore } from '@/features/loans/data/loans-store';
import { totalMonthlyPayment } from '@/features/loans/loans.utils';
import { formatMonthCopenhagen } from '@/lib/datetime';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import { useMonthEntries, type MonthEntryRow } from '../hooks/use-month-entries';

function EntryRow({ row, ym }: { row: MonthEntryRow; ym: string }) {
  const effective = row.actualOre ?? row.forventetOre;
  return (
    <Link href={{ pathname: '/budget/actuals', params: { id: row.id, ym } }} asChild>
      <Pressable
        accessibilityRole="button"
        className="flex-row items-center justify-between gap-3 border-t border-border py-2">
        <View className="flex-1">
          <AppText variant="label">{row.name}</AppText>
          <AppText variant="muted">
            {row.actualOre === null ? 'forventet' : 'faktisk'}
            {row.categories.length ? ` · ${row.categories.join(', ')}` : ''}
          </AppText>
        </View>
        <MoneyText
          ore={effective}
          whole
          variant="label"
          className={cn(row.type === 'income' && 'text-accent-savings')}
        />
      </Pressable>
    </Link>
  );
}

/** Detalje for én budgetmåned: forventet vs. faktisk pr. post (klik for at rette faktisk). */
export function BudgetMonthScreen({ ym }: { ym: string }) {
  const rows = useMonthEntries(ym);
  const loans = useLoansStore((s) => s.loans);
  const loanMonthly = totalMonthlyPayment(loans);

  const incomes = rows.filter((r) => r.type === 'income');
  const expenses = rows.filter((r) => r.type === 'expense');

  const sum = (list: MonthEntryRow[]) => list.reduce((t, r) => t + (r.actualOre ?? r.forventetOre), 0);
  const incomeTotal = sum(incomes);
  const expenseTotal = sum(expenses) + loanMonthly;
  const net = incomeTotal - expenseTotal;

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
          <AppText variant="muted">Udgifter (inkl. lån)</AppText>
          <MoneyText ore={expenseTotal} whole variant="label" />
        </View>
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
        {expenses.map((r) => (
          <EntryRow key={r.id} row={r} ym={ym} />
        ))}
        {loanMonthly > 0 ? (
          <Link href="/loans" asChild>
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center justify-between gap-3 border-t border-border py-2">
              <View className="flex-1">
                <AppText variant="label">Lån</AppText>
                <AppText variant="muted">afbetalingsplan (read-only)</AppText>
              </View>
              <MoneyText ore={loanMonthly} whole variant="label" />
            </Pressable>
          </Link>
        ) : null}
        {expenses.length === 0 && loanMonthly === 0 ? (
          <AppText variant="muted">Ingen denne måned.</AppText>
        ) : null}
      </Card>
    </Screen>
  );
}
