import { Link } from 'expo-router';

import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { formatMonthCopenhagen } from '@/lib/datetime';
import { formatDKKWhole } from '@/lib/money';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import type { RunningMonth } from '../forecast';
import { useMonthEntries } from '../hooks/use-month-entries';

/**
 * En måned i "Kommende måneder": klik → måned-detalje. Viser akkumuleret saldo
 * (overskud/underskud bæres videre) både forventet og aktuel. Faktiske poster
 * vises som børn med både forventet og faktisk, så man kan følge med.
 */
export function ForecastMonthRow({ month }: { month: RunningMonth }) {
  const actuals = useMonthEntries(month.ym).filter((r) => r.actualOre !== null);

  // På rette vej? Aktuel net ift. forventet for måneden: over = grøn, under = rød.
  const onTrack = month.aktuelNet - month.forventetNet;

  return (
    <Link href={{ pathname: '/budget/month/[ym]', params: { ym: month.ym } }} asChild>
      <Pressable accessibilityRole="button" className="border-t border-border py-1.5">
        <View className="flex-row items-baseline">
          <AppText variant="muted" className="flex-1 capitalize">
            {formatMonthCopenhagen(`${month.ym}-01`)}
          </AppText>
          <MoneyText
            ore={month.forventetNet}
            whole
            variant="muted"
            className="flex-1 text-right"
          />
          <MoneyText
            ore={month.aktuelNet}
            whole
            variant="label"
            className={cn(
              'flex-1 text-right',
              onTrack > 0 ? 'text-success' : onTrack < 0 ? 'text-danger' : undefined
            )}
          />
        </View>

        {actuals.length > 0 ? (
          <View className="mt-0.5 gap-0.5 pl-3">
            {actuals.map((r) => (
              <View key={r.id} className="flex-row items-baseline justify-between gap-2">
                <AppText variant="muted" className="flex-1 text-xs">
                  ↳ {r.name}
                </AppText>
                <AppText variant="muted" className="text-xs">
                  forv. {formatDKKWhole(r.forventetOre)} · faktisk {formatDKKWhole(r.actualOre ?? 0)}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}
