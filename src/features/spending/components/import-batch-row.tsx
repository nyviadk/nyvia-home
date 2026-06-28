import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen, formatDateTimeCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { useSpendingSettingsStore } from '../data/spending-settings-store';
import { useTransactionsStore } from '../data/transactions-store';
import { displayAccountName } from '../spending.utils';
import type { ImportBatch } from '../types';

/** En import i historikken — klik for at se posteringer, ændre eller slette. */
export function ImportBatchRow({ batch }: { batch: WithId<ImportBatch> }) {
  const transactions = useTransactionsStore((s) => s.transactions);
  const accounts = useSpendingSettingsStore((s) => s.accounts);
  const own = transactions.filter((t) => t.importBatchId === batch.id);
  const batchAccounts = Array.from(new Set(own.map((t) => t.account))).map((number) =>
    displayAccountName(number, accounts)
  );
  const dates = own.map((t) => t.date).sort();
  const earliest = dates[0];
  const latest = dates[dates.length - 1];

  return (
    <Link href={{ pathname: '/spending/import-batch/[id]', params: { id: batch.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card className="flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <AppText variant="label" numberOfLines={1}>
              {batch.fileName}
            </AppText>
            {batchAccounts.length > 0 ? (
              <AppText variant="muted" numberOfLines={1}>
                Konti: {batchAccounts.join(' · ')}
              </AppText>
            ) : null}
            {earliest && latest ? (
              <AppText variant="muted">
                Periode: {formatDateCopenhagen(earliest)} – {formatDateCopenhagen(latest)}
              </AppText>
            ) : null}
            <AppText variant="muted">
              Importeret {formatDateTimeCopenhagen(batch.importedAt)} · {batch.count} poster
            </AppText>
          </View>
          <AppText variant="muted">›</AppText>
        </Card>
      </Pressable>
    </Link>
  );
}
