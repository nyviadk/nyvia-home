import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { formatMonthCopenhagen, todayISODate } from '@/lib/datetime';
import { cn } from '@/lib/cn';
import { View } from '@/tw';
import { ActualLinesEditor } from '../components/actual-lines-editor';
import { useBudgetEntry } from '../hooks/use-budget-entry';
import { actualTotalOre, effectivePriceOre } from '../pricing';

/** Faktisk vs. forventet for én post i én måned (faktisk kan være flere linjer). */
export function ActualsEditorScreen({ id, ym }: { id: string; ym: string }) {
  const { entry, loading } = useBudgetEntry(id);

  if (loading || !entry) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  const forventet = effectivePriceOre(entry.amount, entry.priceChanges, ym);
  const actual = actualTotalOre(entry.actuals, ym);
  const diff = actual === null ? 0 : actual - forventet;
  // Faktisk kan først indtastes når måneden i virkeligheden er begyndt.
  const isFuture = ym > todayISODate().slice(0, 7);

  return (
    <Screen>
      <View className="gap-1">
        <AppText variant="title">{entry.name}</AppText>
        <AppText variant="muted" className="capitalize">
          {formatMonthCopenhagen(`${ym}-01`)}
        </AppText>
      </View>

      <Card className="gap-2">
        <View className="flex-row items-baseline justify-between">
          <AppText variant="muted">Forventet</AppText>
          <MoneyText ore={forventet} whole variant="label" />
        </View>
        <View className="flex-row items-baseline justify-between">
          <AppText variant="muted">Faktisk</AppText>
          {actual === null ? (
            <AppText variant="muted">—</AppText>
          ) : (
            <MoneyText ore={actual} whole variant="label" />
          )}
        </View>
        {actual !== null ? (
          <View className="flex-row items-baseline justify-between border-t border-border pt-2">
            <AppText variant="muted">Afvigelse</AppText>
            <MoneyText ore={diff} whole variant="label" className={cn(diff > 0 && 'text-danger')} />
          </View>
        ) : null}
      </Card>

      {isFuture ? (
        <AppText variant="muted">
          Du kan først indtaste faktiske beløb når måneden er begyndt. Indtil da bruges det
          forventede.
        </AppText>
      ) : (
        <ActualLinesEditor
          entryId={id}
          monthYm={ym}
          allActuals={entry.actuals ?? {}}
          lines={entry.actuals?.[ym] ?? []}
        />
      )}
    </Screen>
  );
}
