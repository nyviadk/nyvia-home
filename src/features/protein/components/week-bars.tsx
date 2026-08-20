import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { sumTotals } from '../balance';
import { dayKey, recentDays, weekdayShort } from '../day';
import type { ProteinLogEntry } from '../types';

/**
 * Ugens syv dage som søjler. Man kan trykke på en dag for at åbne den.
 *
 * Målet er en STREG hen over søjlerne og ikke søjlens top, fordi det er linjen man
 * sammenligner med: én dag under er ligegyldig, fem dage under er et mønster. Det er
 * gennemsnittet over ugen der tæller.
 */
export function WeekBars({
  entries,
  goal,
  selected,
  onSelect,
}: {
  entries: readonly WithId<ProteinLogEntry>[];
  goal: number;
  selected: string;
  onSelect: (day: string) => void;
}) {
  const days = recentDays(7);
  const totals = days.map((d) => sumTotals(entries.filter((e) => e.day === d)).proteinG);
  // Skalaen følger den højeste dag når nogen er over målet — ellers ville en dag på 160 g
  // se ud som en på 120, og man ville tro de var ens.
  const scale = Math.max(goal, ...totals) * 1.05;
  const today = dayKey();

  return (
    <View className="gap-1.5 pt-2">
      <AppText variant="muted" className="text-xs uppercase">
        Protein, 7 dage
      </AppText>
      <View className="relative h-20 flex-row items-end gap-1.5">
        {/* Mål-stregen ligger bag søjlerne, så en høj dag krydser den synligt. */}
        <View
          className="absolute left-0 right-0 h-px bg-fg-muted"
          style={{ bottom: `${(goal / scale) * 100}%` }}
        />
        {days.map((d, i) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`${weekdayShort(d)}, ${Math.round(totals[i])} gram protein`}
            onPress={() => onSelect(d)}
            className="flex-1 justify-end">
            <View
              className={cn(
                'w-full rounded-t',
                totals[i] >= goal ? 'bg-accent-protein' : 'bg-element',
                d === selected ? 'opacity-100' : 'opacity-60'
              )}
              style={{ height: `${Math.max(2, (totals[i] / scale) * 100)}%` }}
            />
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-1.5">
        {days.map((d) => (
          <AppText
            key={d}
            variant="muted"
            className={cn('flex-1 text-center text-xs', d === today && 'font-semibold text-fg')}>
            {weekdayShort(d)}
          </AppText>
        ))}
      </View>
    </View>
  );
}
