import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { cn } from '@/lib/cn';
import { View } from '@/tw';
import { useSpendingSettingsStore } from '../data/spending-settings-store';
import { makeClassifier, scrubFields } from '../spending.utils';
import type { BankTransaction } from '../types';
import { KindBadge } from './kind-badge';

/** Read-only visning af én importeret transaktion (oversigt/mobil). */
export function TransactionRow({ transaction }: { transaction: WithId<BankTransaction> }) {
  const rules = useSpendingSettingsStore((s) => s.scrubRules);
  const accounts = useSpendingSettingsStore((s) => s.accounts);
  const { text, payer, counterparty } = scrubFields(transaction, rules);
  const kind = makeClassifier(accounts)(transaction);
  const negative = transaction.amountOre < 0;
  return (
    <Card className={cn('flex-row items-center gap-3', kind === 'internal' && 'opacity-60')}>
      <View className="flex-1 gap-0.5">
        <AppText variant="label" numberOfLines={1}>
          {text || counterparty || payer || '—'}
        </AppText>
        <View className="flex-row items-center gap-2">
          <AppText variant="muted">{formatDateCopenhagen(transaction.date)}</AppText>
          <KindBadge kind={kind} />
        </View>
      </View>
      <MoneyText
        ore={transaction.amountOre}
        variant="label"
        className={negative ? 'text-fg' : 'text-accent-savings'}
      />
    </Card>
  );
}
