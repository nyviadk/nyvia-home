import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { formatDKKWhole } from '@/lib/money';
import { Pressable, View } from '@/tw';
import type { BankTransaction, OwnAccount } from '../types';
import { displayAccountName, lastBalanceOre, spendingInMonthOre } from '../spending.utils';

/** Konto-kort på forsiden: navn, saldo og forbrug i den valgte måned. */
export function AccountRow({
  account,
  transactions,
  accounts,
  month,
}: {
  account: string;
  transactions: WithId<BankTransaction>[];
  accounts: OwnAccount[];
  month: string;
}) {
  const balance = lastBalanceOre(transactions);
  const spending = spendingInMonthOre(transactions, month, accounts);

  return (
    <Link href={{ pathname: '/spending/[account]', params: { account } }} asChild>
      <Pressable accessibilityRole="button">
        <Card className="flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <AppText variant="label">{displayAccountName(account, accounts)}</AppText>
            <AppText variant="muted">
              {balance != null ? `Saldo ${formatDKKWhole(balance)}` : `${transactions.length} poster`}
            </AppText>
          </View>
          <View className="items-end">
            <MoneyText ore={spending} whole variant="label" className="text-danger" />
            <AppText variant="muted">forbrug denne md.</AppText>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
