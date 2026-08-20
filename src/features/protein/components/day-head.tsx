import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import type { Assessment, Totals } from '../balance';
import { dayLabel } from '../day';
import { dk } from '../format';
import { BrickBar } from './brick-bar';

/**
 * Dagens hoved: de to tal, de to klodsebjælker og status.
 *
 * Protein og kalorier får den SAMME slags bjælke. De er to mål der skal rammes sammen, og
 * viste man kun det ene som klodser, ville øjet læse det andet som mindre vigtigt — hvilket
 * er præcis den skævhed systemet findes for at fange. Farven skiller dem ad, ikke formen.
 */
export function DayHead({
  day,
  isToday,
  onShiftDay,
  totals,
  proteinGoal,
  kcalGoal,
  assessment,
}: {
  day: string;
  isToday: boolean;
  onShiftDay: (days: number) => void;
  totals: Totals;
  proteinGoal: number;
  kcalGoal: number;
  assessment: Assessment;
}) {
  const over = assessment.state === 'over-kcal';

  return (
    <View
      className="gap-3.5 rounded-xl border border-border bg-card p-4"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-center justify-between">
        <AppText variant="muted" className="text-xs uppercase tracking-widest">
          Proteinkort
        </AppText>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Forrige dag"
            hitSlop={10}
            onPress={() => onShiftDay(-1)}>
            <AppText className="text-base leading-none text-fg-muted">{'‹'}</AppText>
          </Pressable>
          <AppText variant="muted" className="text-xs uppercase">
            {dayLabel(day)}
          </AppText>
          {/* Fremad er spærret på i dag: man logger ikke mad man ikke har spist. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Næste dag"
            hitSlop={10}
            disabled={isToday}
            onPress={() => onShiftDay(1)}>
            <AppText
              className={cn('text-base leading-none', isToday ? 'text-border' : 'text-fg-muted')}>
              {'›'}
            </AppText>
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <AppText className="text-4xl font-bold leading-none text-accent-protein">
          {Math.round(totals.proteinG)}
          <AppText variant="muted" className="text-sm font-normal"> g protein</AppText>
        </AppText>
        <AppText
          className={cn('text-2xl font-bold leading-none', over ? 'text-danger' : 'text-primary')}>
          {dk(totals.kcal)}
          <AppText variant="muted" className="text-xs font-normal"> kcal</AppText>
        </AppText>
      </View>

      <BrickBar label="Protein" value={totals.proteinG} goal={proteinGoal} unit="g" tone="protein" />
      <BrickBar
        label="Kalorier"
        value={totals.kcal}
        goal={kcalGoal}
        unit="kcal"
        tone="kcal"
        over={over}
      />

      <View className="gap-1 border-t border-border pt-3">
        <AppText className={cn('text-sm font-semibold', over ? 'text-danger' : 'text-fg')}>
          {assessment.headline}
        </AppText>
        {assessment.advice ? (
          <AppText variant="muted" className="text-sm leading-relaxed">
            {assessment.advice}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
