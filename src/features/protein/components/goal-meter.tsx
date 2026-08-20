import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { View } from '@/tw';

/**
 * Én måler: navn, tal, og en bjælke der viser hvor langt man er.
 *
 * Bjælken har et mærke ved målet i stedet for bare at stoppe dér. Uden mærket kan man ikke
 * se forskel på "lige præcis i mål" og "langt over", fordi en fuld bjælke ser ens ud begge
 * steder — og for kalorier er dét netop forskellen der betyder noget.
 */
export function GoalMeter({
  label,
  value,
  goal,
  unit,
  tone,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  /** Farven på bjælken. `over` bruges når kalorierne er sprængt. */
  tone: 'protein' | 'kcal' | 'over';
}) {
  const pct = goal > 0 ? value / goal : 0;
  // Bjælken viser op til 125 % af målet, så en overskridelse kan SES og ikke bare rammer kanten.
  const width = Math.max(0, Math.min(1, pct / 1.25)) * 100;
  const goalMark = (1 / 1.25) * 100;

  return (
    <View className="flex-1 gap-1.5">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="muted" className="text-xs uppercase">
          {label}
        </AppText>
        <AppText variant="muted" className="text-xs">
          {Math.round(pct * 100)} %
        </AppText>
      </View>

      <AppText className="text-2xl font-bold leading-none text-fg">
        {Math.round(value)}
        <AppText variant="muted" className="text-sm font-normal">
          {' '}
          / {goal} {unit}
        </AppText>
      </AppText>

      <View className="h-2.5 w-full overflow-hidden rounded-full bg-element">
        <View
          className={cn(
            'h-full rounded-full',
            tone === 'over' ? 'bg-danger' : tone === 'protein' ? 'bg-accent-protein' : 'bg-primary'
          )}
          style={{ width: `${width}%` }}
        />
      </View>
      {/* Mål-mærket ligger under bjælken frem for oven i: en streg hen over en farvet
          bjælke forsvinder i den, og hele pointen er at man kan se hvor grænsen går. */}
      <View className="h-1.5 w-full">
        <View className="absolute h-1.5 w-px bg-fg-muted" style={{ left: `${goalMark}%` }} />
      </View>
    </View>
  );
}
