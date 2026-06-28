import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateCopenhagen, formatDateTimeCopenhagen } from '@/lib/datetime';
import { toastAfter } from '@/lib/toast/notify';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import { BulkProgress } from '../components/bulk-progress';
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
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const cancelRef = useRef(false);

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
  const latest = rows[0]?.date;
  const earliest = rows[rows.length - 1]?.date;

  async function onDelete() {
    if (!batch) return;
    const ok = await confirmAction(
      'Slet import',
      `Slet "${batch.fileName}" og dens transaktioner? Poster der senere er gen-importeret beholdes.`,
      'Slet'
    );
    if (!ok) return;
    setBusy(true);
    cancelRef.current = false;
    setProgress({ done: 0, total: rows.length });
    try {
      await deleteTransactionsOfBatch(transactions, batch.id, {
        onProgress: (done, total) => setProgress({ done, total }),
        shouldCancel: () => cancelRef.current,
      });
      if (cancelRef.current) {
        await toastAfter(Promise.resolve(), 'Sletning annulleret (delvist slettet)');
        return;
      }
      await deleteImportBatch(batch.id);
      await toastAfter(Promise.resolve(), 'Import slettet');
      router.back();
    } finally {
      setBusy(false);
      setProgress(null);
    }
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
        {earliest && latest ? (
          <AppText variant="muted">
            {formatDateCopenhagen(earliest)} – {formatDateCopenhagen(latest)}
          </AppText>
        ) : null}
        <AppText variant="muted">
          {batch.count} poster · {batch.internalCount} interne · {batch.duplicateCount} dubletter
          ignoreret
        </AppText>
      </Card>

      <BulkProgress
        visible={!!progress}
        label="Sletter…"
        done={progress?.done ?? 0}
        total={progress?.total ?? 0}
        onCancel={() => {
          cancelRef.current = true;
        }}
      />

      <AppText variant="muted">Klik en postering for at se data eller ændre klassifikation.</AppText>

      <View className="gap-2">
        {rows.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </View>

      <View className="items-center pb-2 pt-4">
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          disabled={busy}
          hitSlop={8}>
          <AppText className={cn('text-sm text-danger', busy && 'opacity-50')}>
            {busy ? 'Sletter…' : 'Slet hele importen'}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
