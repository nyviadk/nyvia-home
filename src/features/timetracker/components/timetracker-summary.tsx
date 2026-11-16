import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { formatDuration } from '../time.utils';
import type { TimeEntry } from '../types';
import { formatParallelism, timeTotals } from '../work-time';

/**
 * Arbejdstid (fakturerbar) + opgavetid og parallelitet + nedbrydning pr. funktion for de
 * (allerede filtrerede) poster.
 */
export function TimetrackerSummary({
  entries,
  periode,
}: {
  entries: WithId<TimeEntry>[];
  /** Hvad tallet dækker, fx "uge 36 · 31. aug.–6. sep.". Uden den kan man ikke se om
   *  totalen er denne uge eller de seneste syv døgn — og de to ligner hinanden. */
  periode?: string;
}) {
  const { workMinutes, taskMinutes, parallelism } = timeTotals(entries);
  const openCount = entries.filter((e) => !e.endTime).length;

  const byCategory = new Map<string, number>();
  for (const e of entries) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.durationMinutes);
  }
  const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <View className="gap-3">
      <Card className="gap-1 border-0 bg-accent-time">
        <AppText className="text-on-primary/80">
          Arbejdstid{periode ? ` · ${periode}` : ''}
        </AppText>
        <AppText className="text-3xl font-bold text-on-primary">
          {formatDuration(workMinutes)}
        </AppText>
        <View className="flex-row flex-wrap gap-x-4">
          <AppText className="text-on-primary/80">Opgavetid {formatDuration(taskMinutes)}</AppText>
          {parallelism !== null ? (
            <AppText className="text-on-primary/80">
              Parallelitet {formatParallelism(parallelism)}
            </AppText>
          ) : null}
        </View>
        {openCount > 0 ? (
          <AppText className="text-on-primary/90">
            ⚠ {openCount} {openCount === 1 ? 'post mangler' : 'poster mangler'} sluttid
          </AppText>
        ) : null}
      </Card>

      {/* Bevidst UDEN total: summen af rækkerne er opgavetid, ikke arbejdstid, og en total
          her ville ligne det fakturerbare tal. */}
      {rows.length > 0 ? (
        <Card className="gap-2">
          <AppText variant="heading">Opgavetid pr. funktion</AppText>
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
