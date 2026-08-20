import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { sumTotals } from '../balance';
import { dayKey, recentDays, weekdayShort } from '../day';
import type { ProteinLogEntry } from '../types';

/**
 * Ugen med to søjler pr. dag: protein og kalorier ved siden af hinanden.
 *
 * Begge og ikke kun protein, fordi det er FORHOLDET mellem dem der er hele pointen. En dag
 * hvor den ene søjle er høj og den anden lav, er en dag der er gået skævt — og det ser man
 * kun hvis de står side om side.
 *
 * Højden er procent af hver sit mål, så de to er sammenlignelige selvom tallene ikke er.
 * Begge er loftet ved 100 %: en dag på det dobbelte af kaloriemålet skal ikke trykke resten
 * af ugen ned i bunden af grafen.
 */
export function WeekBars({
  entries,
  proteinGoal,
  kcalGoal,
  selected,
  onSelect,
}: {
  entries: readonly WithId<ProteinLogEntry>[];
  proteinGoal: number;
  kcalGoal: number;
  selected: string;
  onSelect: (day: string) => void;
}) {
  const days = recentDays(7);
  const today = dayKey();

  return (
    <View className="gap-1.5 pt-6">
      {/* Ingen `items-end` på rækken: den gør hver kolonne lige så høj som sit indhold, og
          så har søjlens `height: X%` ingen kendt højde at regne imod — grafen bliver tom. */}
      <View className="h-14 flex-row gap-1.5">
        {days.map((d) => {
          const t = sumTotals(entries.filter((e) => e.day === d));
          const p = Math.min(100, (t.proteinG / Math.max(1, proteinGoal)) * 100);
          const k = Math.min(100, (t.kcal / Math.max(1, kcalGoal)) * 100);
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={`${weekdayShort(d)}, ${Math.round(t.proteinG)} gram protein og ${Math.round(t.kcal)} kalorier`}
              onPress={() => onSelect(d)}
              className={cn('h-full flex-1 flex-row gap-0.5', d !== selected && 'opacity-60')}>
              <View className="h-full flex-1 justify-end overflow-hidden rounded-sm border border-border bg-element">
                <View className="w-full bg-accent-protein" style={{ height: `${p}%` }} />
              </View>
              <View className="h-full flex-1 justify-end overflow-hidden rounded-sm border border-border bg-element">
                <View className="w-full bg-primary" style={{ height: `${k}%` }} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-1.5">
        {days.map((d) => (
          <AppText
            key={d}
            variant="muted"
            className={cn('flex-1 text-center text-[10px]', d === today && 'font-semibold text-fg')}>
            {weekdayShort(d).replace('.', '')}
          </AppText>
        ))}
      </View>

      <View className="flex-row justify-center gap-4 pt-1">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-sm bg-accent-protein" />
          <AppText variant="muted" className="text-[10px]">
            protein
          </AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-sm bg-primary" />
          <AppText variant="muted" className="text-[10px]">
            kalorier
          </AppText>
        </View>
      </View>
    </View>
  );
}
