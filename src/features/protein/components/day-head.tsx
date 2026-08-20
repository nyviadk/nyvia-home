import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import type { Assessment, Totals } from '../balance';
import { dayLabel } from '../day';
import { dk } from '../format';

/** Antal klodser i proteinbjælken. Hver klods er derfor en tolvtedel af dagsmålet. */
const BRICKS = 12;

/**
 * Dagens hoved: de to tal, proteinklodserne, kaloriestregen og status.
 *
 * Klodserne er ikke pynt. En glidende bjælke kan man ikke aflæse — man ser at den er "et
 * stykke henne". Tolv klodser kan tælles, og med et mål på 120 g er hver klods 10 g, så man
 * ved med det samme hvad der mangler uden at regne på procenter.
 *
 * Kalorierne får en tynd streg og et mindre tal. De er en ramme man holder sig inden for,
 * ikke noget man samler op — og skal derfor ikke fylde lige så meget som proteinet.
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
  const perBrick = proteinGoal / BRICKS;
  const kcalPct = Math.min(100, (totals.kcal / Math.max(1, kcalGoal)) * 100);
  const over = assessment.state === 'over-kcal';

  return (
    <View
      className="gap-3 rounded-xl border border-border bg-card p-4"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-center justify-between">
        <AppText variant="muted" className="text-xs uppercase">
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
              className={cn(
                'text-base leading-none',
                isToday ? 'text-border' : 'text-fg-muted'
              )}>
              {'›'}
            </AppText>
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <View>
          <AppText variant="muted" className="text-[10px] uppercase">
            Protein
          </AppText>
          <AppText className="text-4xl font-bold leading-none text-fg">
            {Math.round(totals.proteinG)}
            <AppText variant="muted" className="text-sm font-normal"> / {proteinGoal} g</AppText>
          </AppText>
        </View>
        <View className="items-end">
          <AppText variant="muted" className="text-[10px] uppercase">
            Kalorier
          </AppText>
          <AppText
            className={cn(
              'text-xl font-bold leading-none',
              over ? 'text-danger' : 'text-primary'
            )}>
            {dk(totals.kcal)}
            <AppText variant="muted" className="text-xs font-normal"> / {dk(kcalGoal)}</AppText>
          </AppText>
        </View>
      </View>

      <View className="gap-1">
        <View className="h-6 flex-row gap-[3px]">
          {Array.from({ length: BRICKS }, (_, i) => {
            const fill = Math.max(0, Math.min(1, (totals.proteinG - i * perBrick) / perBrick));
            return (
              <View
                key={i}
                className="flex-1 overflow-hidden rounded-sm border border-border bg-element">
                <View className="h-full bg-accent-protein" style={{ width: `${fill * 100}%` }} />
              </View>
            );
          })}
        </View>
        <View className="flex-row justify-between">
          <AppText variant="muted" className="text-[10px]">
            0
          </AppText>
          <AppText variant="muted" className="text-[10px]">
            hver klods = {Math.round(perBrick)} g
          </AppText>
          <AppText variant="muted" className="text-[10px]">
            {proteinGoal}
          </AppText>
        </View>
      </View>

      <View className="h-1.5 overflow-hidden rounded-sm border border-border bg-element">
        <View
          className={cn('h-full', over ? 'bg-danger' : 'bg-primary')}
          style={{ width: `${kcalPct}%` }}
        />
      </View>

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
