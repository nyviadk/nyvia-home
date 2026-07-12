import { AppText } from '@/components/ui/text';
import { Text, View } from '@/tw';
import type { UvSnapshot } from '../types';
import { burnAdvice, daySummaries, upcomingSunPoints, uvLevel } from '../uv.utils';
import { DayRow } from './day-row';
import { HourStrip } from './hour-strip';

/** Fælles overblik (worst case på tværs af steder): nu, dag-for-dag, og time-strip. */
export function UvSummary({ snapshot }: { snapshot: UvSnapshot }) {
  const level = uvLevel(snapshot.current);
  const days = daySummaries(snapshot);
  const strip = upcomingSunPoints(snapshot);

  return (
    <View className="gap-3">
      <View className="flex-row items-end gap-3">
        <Text style={{ color: level.color }} className="text-5xl font-bold">
          {snapshot.current.toFixed(1)}
        </Text>
        <View className="flex-1 pb-1">
          <Text style={{ color: level.color }} className="text-base font-semibold">
            {level.label}
          </Text>
          <AppText variant="muted">{burnAdvice(snapshot.current)}</AppText>
        </View>
      </View>

      <View className="gap-0.5">
        {days.map((d) => (
          <DayRow key={d.t} day={d} />
        ))}
      </View>

      <HourStrip label={strip.label} points={strip.points} />
    </View>
  );
}
