import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { todayISODate } from '@/lib/datetime';
import { Pressable, View } from '@/tw';
import { AccountRow } from '../components/account-row';
import { useSpendingSettingsStore } from '../data/spending-settings-store';
import { useTransactionsStore } from '../data/transactions-store';
import { accountNumbers, spendingInMonthOre } from '../spending.utils';

const isWeb = process.env.EXPO_OS === 'web';

export function SpendingOverviewScreen() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const loading = useTransactionsStore((s) => s.loading);
  const fromCache = useTransactionsStore((s) => s.fromCache);
  const accounts = useSpendingSettingsStore((s) => s.accounts);

  const month = todayISODate().slice(0, 7);
  const numbers = accountNumbers(transactions).sort();
  const totalSpending = spendingInMonthOre(transactions, month, accounts);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Forbrug</AppText>
        <View className="flex-row gap-2">
          <Link href="/spending/settings" asChild>
            <Button title="Indstillinger" variant="secondary" className="h-10 px-4" />
          </Link>
          {isWeb ? (
            <Link href="/spending/import" asChild>
              <Button title="Importér" className="h-10 px-4" />
            </Link>
          ) : null}
        </View>
      </View>

      {fromCache ? <AppText variant="muted">Offline – viser gemte data</AppText> : null}

      {numbers.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen transaktioner endnu"
            description={
              isWeb
                ? 'Importér en CSV-eksport fra banken for at se dit faktiske forbrug pr. konto.'
                : 'Importér bankdata på web — her kan du se forbruget bagefter.'
            }
          />
        )
      ) : (
        <>
          <Card className="border-0 bg-accent-budget">
            <AppText className="text-on-primary/80">Forbrug denne måned (alle konti)</AppText>
            <MoneyText ore={totalSpending} whole className="text-3xl font-bold text-on-primary" />
          </Card>

          <View className="gap-2">
            {numbers.map((account) => (
              <AccountRow
                key={account}
                account={account}
                transactions={transactions.filter((t) => t.account === account)}
                accounts={accounts}
                month={month}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
