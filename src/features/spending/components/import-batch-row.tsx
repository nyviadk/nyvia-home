import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import { Pressable, View } from '@/tw';
import { deleteImportBatch } from '../data/import-batches.repository';
import { deleteTransactionsOfBatch } from '../data/transactions.repository';
import { useTransactionsStore } from '../data/transactions-store';
import type { ImportBatch } from '../types';

/** En import i historikken — kan slettes (fjerner også dens transaktioner). */
export function ImportBatchRow({ batch }: { batch: WithId<ImportBatch> }) {
  async function onDelete() {
    const ok = await confirmAction(
      'Slet import',
      `Slet "${batch.fileName}" og dens ${batch.count} transaktioner? Poster der senere er gen-importeret beholdes.`,
      'Slet'
    );
    if (!ok) return;
    const txns = useTransactionsStore.getState().transactions;
    await toastAfter(
      (async () => {
        await deleteTransactionsOfBatch(txns, batch.id);
        await deleteImportBatch(batch.id);
      })(),
      'Import slettet'
    );
  }

  return (
    <Card className="flex-row items-center gap-3">
      <View className="flex-1 gap-0.5">
        <AppText variant="label" numberOfLines={1}>
          {batch.fileName}
        </AppText>
        <AppText variant="muted">
          {formatDateTimeCopenhagen(batch.importedAt)} · {batch.count} poster
        </AppText>
      </View>
      <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
        <AppText className="text-sm text-danger">Slet</AppText>
      </Pressable>
    </Card>
  );
}
