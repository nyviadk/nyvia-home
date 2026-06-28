import { router, useLocalSearchParams } from 'expo-router';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import { toastAfter } from '@/lib/toast/notify';
import { Pressable, View } from '@/tw';
import { TransactionRow } from '../components/transaction-row';
import { deleteImportBatch } from '../data/import-batches.repository';
import { useImportBatchesStore } from '../data/import-batches-store';
import { useSpendingSettingsStore } from '../data/spending-settings-store';
import { deleteTransactionsOfBatch } from '../data/transactions.repository';
import { useTransactionsStore } from '../data/transactions-store';
import { displayAccountName } from '../spending.utils';

export function ImportBatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const batch = useImportBatchesStore((s) => s.batches.find((b) => b.id === id));
  const transactions = useTransactionsStore((s) => s.transactions);
  const accounts = useSpendingSettingsStore((s) => s.accounts);

  if (!batch) {
    return (
      <Screen>
        <EmptyState title="Import ikke fundet" description="Den er måske slettet." />
      </Screen>
    );
  }

  const rows = transactions
    .filter((t) => t.importBatchId === batch.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const batchAccounts = Array.from(new Set(rows.map((t) => t.account))).map((n) =>
    displayAccountName(n, accounts)
  );

  async function onDelete() {
    if (!batch) return;
    const ok = await confirmAction(
      'Slet import',
      `Slet "${batch.fileName}" og dens transaktioner? Poster der senere er gen-importeret beholdes.`,
      'Slet'
    );
    if (!ok) return;
    await toastAfter(
      (async () => {
        await deleteTransactionsOfBatch(transactions, batch.id);
        await deleteImportBatch(batch.id);
      })(),
      'Import slettet'
    );
    router.back();
  }

  return (
    <Screen>
      <AppText variant="title" numberOfLines={1}>
        {batch.fileName}
      </AppText>

      <Card className="gap-1">
        <AppText variant="muted">{formatDateTimeCopenhagen(batch.importedAt)}</AppText>
        {batchAccounts.length > 0 ? (
          <AppText variant="label">{batchAccounts.join(' · ')}</AppText>
        ) : null}
        <AppText variant="muted">
          {batch.count} poster · {batch.internalCount} interne · {batch.duplicateCount} dubletter
          ignoreret
        </AppText>
      </Card>

      <AppText variant="muted">Klik en postering for at se data eller ændre klassifikation.</AppText>

      <View className="gap-2">
        {rows.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </View>

      <View className="items-center pb-2 pt-4">
        <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
          <AppText className="text-sm text-danger">Slet hele importen</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
