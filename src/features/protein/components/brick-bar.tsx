import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { View } from '@/tw';
import { dk } from '../format';

/** Antal klodser. Hver klods er en tolvtedel af dagsmålet. */
const BRICKS = 12;

/**
 * Målet som tolv klodser der fyldes op.
 *
 * En glidende bjælke kan man ikke aflæse — man ser at den er "et stykke henne". Tolv klodser
 * kan tælles, og så ved man hvad der mangler uden at regne på procenter. Klodsværdien følger
 * målet, så den bliver ved med at passe når man ændrer det.
 *
 * Sidste klods fyldes ikke ud over 100 %: en overskridelse ses på farven og på tallet, ikke
 * på klodserne, for der findes ikke en trettende klods at vise den i.
 */
export function BrickBar({
  label,
  value,
  goal,
  unit,
  tone,
  over,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  tone: 'protein' | 'kcal';
  /** Farver klodserne røde. Sættes når kaloriemålet er sprængt. */
  over?: boolean;
}) {
  const safeGoal = Math.max(1, goal);
  const perBrick = safeGoal / BRICKS;
  const fillClass = over ? 'bg-danger' : tone === 'protein' ? 'bg-accent-protein' : 'bg-primary';

  return (
    <View className="gap-1">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="muted" className="text-[10px] uppercase tracking-widest">
          {label}
        </AppText>
        <AppText variant="muted" className="text-[11px]">
          {dk(value)} / {dk(goal)} {unit}
        </AppText>
      </View>

      <View className="h-5 flex-row gap-[3px]">
        {Array.from({ length: BRICKS }, (_, i) => {
          const fill = Math.max(0, Math.min(1, (value - i * perBrick) / perBrick));
          return (
            <View
              key={i}
              className="flex-1 overflow-hidden rounded-sm border border-border bg-element">
              <View className={cn('h-full', fillClass)} style={{ width: `${fill * 100}%` }} />
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between">
        <AppText variant="muted" className="text-[10px]">
          0
        </AppText>
        <AppText variant="muted" className="text-[10px]">
          hver klods = {dk(perBrick)} {unit}
        </AppText>
        <AppText variant="muted" className="text-[10px]">
          {dk(goal)}
        </AppText>
      </View>
    </View>
  );
}
