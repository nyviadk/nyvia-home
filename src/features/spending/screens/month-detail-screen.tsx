import { useLocalSearchParams } from 'expo-router';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { formatMonthCopenhagen } from '@/lib/datetime';
import { View } from '@/tw';
import { TransactionRow } from '../components/transaction-row';
import { useSpendingSettingsStore } from '../data/spending-settings-store';
import { useTransactionsStore } from '../data/transactions-store';
import { accountNumbers, displayAccountName, spendingInMonthOre, ym } from '../spending.utils';

export function MonthDetailScreen() {
  const { ym: month } = useLocalSearchParams<{ ym: string }>();
  const transactions = useTransactionsStore((s) => s.transactions);
  const accounts = useSpendingSettingsStore((s) => s.accounts);

  const monthTxns = transactions.filter((t) => ym(t.date) === month);
  const total = spendingInMonthOre(monthTxns, month ?? '', accounts);
  const numbers = accountNumbers(monthTxns).sort();

  return (
    <Screen>
      <AppText variant="title">{capitalize(formatMonthCopenhagen(`${month}-01`))}</AppText>

      {monthTxns.length === 0 ? (
        <EmptyState title="Ingen posteringer" description="Der er ingen poster i denne måned." />
      ) : (
        <>
          <Card className="border-0 bg-accent-budget">
            <AppText className="text-on-primary/80">Forbrug denne måned (alle konti)</AppText>
            <MoneyText ore={total} whole className="text-3xl font-bold text-on-primary" />
          </Card>

          {numbers.map((account) => {
            const accTxns = monthTxns
              .filter((t) => t.account === account)
              .sort((a, b) => b.date.localeCompare(a.date));
            const accTotal = spendingInMonthOre(accTxns, month ?? '', accounts);
            return (
              <View key={account} className="gap-2">
                <Card className="flex-row items-center justify-between">
                  <AppText variant="label">{displayAccountName(account, accounts)}</AppText>
                  <View className="items-end">
                    <MoneyText ore={accTotal} whole variant="label" className="text-danger" />
                    <AppText variant="muted">forbrug</AppText>
                  </View>
                </Card>
                {accTxns.map((t) => (
                  <TransactionRow key={t.id} transaction={t} />
                ))}
              </View>
            );
          })}
        </>
      )}
    </Screen>
  );
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
