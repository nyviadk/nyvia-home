import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import { cn } from '@/lib/cn';
import { Switch, View } from '@/tw';
import { useSpendingSettingsStore } from '../data/spending-settings-store';
import type { ReviewRow as ReviewRowData } from '../lib/build-import';
import { scrubFields } from '../spending.utils';
import { TRANSACTION_KINDS, type TransactionKind } from '../types';

/** Én redigerbar række i import-review: klassifikation + medtag-til/fra. */
export function ReviewRow({
  row,
  kind,
  onToggleInclude,
  onChangeKind,
}: {
  row: ReviewRowData;
  /** Live-beregnet klassifikation (manuel overstyring vinder). */
  kind: TransactionKind;
  onToggleInclude: (id: string, include: boolean) => void;
  onChangeKind: (id: string, kind: TransactionKind) => void;
}) {
  const rules = useSpendingSettingsStore((s) => s.scrubRules);
  const { text, payer, counterparty } = scrubFields(row, rules);
  return (
    <Card className={cn('gap-2', !row.include && 'opacity-50')}>
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          <AppText variant="label" numberOfLines={1}>
            {text || counterparty || payer || '—'}
          </AppText>
          <View className="flex-row items-center gap-2">
            <AppText variant="muted">{formatDateCopenhagen(row.date)}</AppText>
            {row.duplicate ? (
              <AppText variant="muted" className="text-accent-moving">
                allerede importeret
              </AppText>
            ) : null}
          </View>
        </View>
        <MoneyText ore={row.amountOre} variant="label" />
        <Switch value={row.include} onValueChange={(v) => onToggleInclude(row.id, v)} />
      </View>

      <Segmented
        value={kind}
        options={TRANSACTION_KINDS}
        onChange={(next) => onChangeKind(row.id, next)}
      />
    </Card>
  );
}
