import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { formatMonthCopenhagen } from '@/lib/datetime';
import { cn } from '@/lib/cn';
import { View } from '@/tw';
import { averageDisposableOre, forecastMonths } from '../forecast';
import { useForecastInput } from '../hooks/use-forecast';

function Row({ label, ore, strong }: { label: string; ore: number; strong?: boolean }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <AppText variant={strong ? 'label' : 'muted'}>{label}</AppText>
      <MoneyText ore={ore} whole variant={strong ? 'label' : 'muted'} />
    </View>
  );
}

/** Forecast-overblik: rådighedsbeløb denne md + gennemsnit + kommende måneder. */
export function ForecastSummary() {
  const input = useForecastInput();
  const months = forecastMonths(12, input);
  const current = months[0];
  const average = averageDisposableOre(input);

  return (
    <View className="gap-3">
      <Card className="gap-3 border-0 bg-primary">
        <View className="gap-1">
          <AppText className="text-on-primary/80">Rådighedsbeløb denne måned</AppText>
          <MoneyText ore={current.net} whole className="text-3xl font-bold text-on-primary" />
        </View>
        <View className="flex-row items-baseline justify-between">
          <AppText className="text-on-primary/80">Gennemsnit / md.</AppText>
          <MoneyText ore={average} whole className="font-semibold text-on-primary" />
        </View>
      </Card>

      <Card className="gap-2">
        <Row label="Indtægter" ore={current.income} />
        <Row label="Faste udgifter (inkl. lån)" ore={current.expenses} />
        <View className="mt-1 border-t border-border pt-2">
          <Row label="= Rådighedsbeløb" ore={current.net} strong />
        </View>
      </Card>

      <Card className="gap-1">
        <AppText variant="heading">Kommende måneder</AppText>
        {months.map((m) => (
          <View key={m.ym} className="flex-row items-baseline justify-between py-0.5">
            <AppText variant="muted" className="capitalize">
              {formatMonthCopenhagen(`${m.ym}-01`)}
            </AppText>
            <MoneyText
              ore={m.net}
              whole
              variant="label"
              className={cn(m.net < 0 && 'text-danger')}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}
