import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import { scrubFields } from '../spending.utils';
import type { BankTransaction, ScrubRule, TransactionKind } from '../types';
import { KindBadge } from './kind-badge';

/**
 * Én importeret transaktion — klik for at se al CSV-data (rå + renset).
 *
 * `kind` og `rules` kommer UDEFRA med vilje: rækken lå i lister med hundredvis af poster og
 * abonnerede før på settings-storen to gange pr. række OG byggede en ny klassifikations-
 * funktion pr. render. Forælderen bygger nu classifieren én gang. Samme form som `ReviewRow`.
 */
export function TransactionRow({
  transaction,
  kind,
  rules,
}: {
  transaction: WithId<BankTransaction>;
  kind: TransactionKind;
  rules: readonly ScrubRule[];
}) {
  const { text, payer, counterparty } = scrubFields(transaction, rules);
  const negative = transaction.amountOre < 0;
  return (
    <Link href={{ pathname: '/spending/transaction/[id]', params: { id: transaction.id } }} asChild>
      <Pressable accessibilityRole="button">
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
      </Pressable>
    </Link>
  );
}
