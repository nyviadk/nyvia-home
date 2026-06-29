import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { formatDuration } from '../time.utils';
import type { TimeEntry } from '../types';

/** Total + nedbrydning pr. funktion for de (allerede filtrerede) poster. */
export function TimetrackerSummary({ entries }: { entries: WithId<TimeEntry>[] }) {
  const total = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  const openCount = entries.filter((e) => !e.endTime).length;

  const byCategory = new Map<string, number>();
  for (const e of entries) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.durationMinutes);
  }
  const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <View className="gap-3">
      <Card className="gap-1 border-0 bg-accent-time">
        <AppText className="text-on-primary/80">Tid i alt</AppText>
        <AppText className="text-3xl font-bold text-on-primary">{formatDuration(total)}</AppText>
        {openCount > 0 ? (
          <AppText className="text-on-primary/90">
            ⚠ {openCount} {openCount === 1 ? 'post mangler' : 'poster mangler'} sluttid
          </AppText>
        ) : null}
      </Card>

      {rows.length > 0 ? (
        <Card className="gap-2">
          <AppText variant="heading">Pr. funktion</AppText>
          {rows.map(([category, minutes]) => (
            <View key={category} className="flex-row items-baseline justify-between">
              <AppText variant="muted">{category}</AppText>
              <AppText variant="label">{formatDuration(minutes)}</AppText>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
