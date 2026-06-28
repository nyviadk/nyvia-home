import { useState } from 'react';
import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { Screen } from '@/components/ui/screen';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Switch, View } from '@/tw';
import { TimeEntryRow } from '../components/time-entry-row';
import { TimetrackerSummary } from '../components/timetracker-summary';
import { usePendingTimeDeletes } from '../data/pending-deletes';
import { useTimetrackerSettingsStore } from '../data/timetracker-settings-store';
import { useTimetrackerStore } from '../data/timetracker-store';
import { formatDuration, rangeStartDate, type TimeRange } from '../time.utils';
import type { TimeEntry } from '../types';

const RANGE_OPTIONS = [
  { value: 'today' as const, label: 'I dag' },
  { value: 'week' as const, label: 'Uge' },
  { value: 'month' as const, label: 'Måned' },
  { value: 'year' as const, label: 'År' },
  { value: 'all' as const, label: 'Alt' },
];

function DayGroup({ date, entries }: { date: string; entries: WithId<TimeEntry>[] }) {
  const total = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="heading" className="capitalize">
          {formatDateCopenhagen(`${date}T00:00:00`)}
        </AppText>
        <AppText variant="muted">{formatDuration(total)}</AppText>
      </View>
      {entries.map((entry) => (
        <TimeEntryRow key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

export function TimetrackerScreen() {
  const [range, setRange] = useState<TimeRange>('week');
  const [onlyAfterOfficial, setOnlyAfterOfficial] = useState(false);

  const entries = useTimetrackerStore((s) => s.entries);
  const loading = useTimetrackerStore((s) => s.loading);
  const fromCache = useTimetrackerStore((s) => s.fromCache);
  const pendingIds = usePendingTimeDeletes((s) => s.ids);
  const officialStart = useTimetrackerSettingsStore((s) => s.officialStartDate);

  const rangeStart = rangeStartDate(range);
  const visible = entries
    .filter((e) => !pendingIds.has(e.id))
    .filter((e) => (rangeStart === null ? true : e.date >= rangeStart))
    .filter((e) => (onlyAfterOfficial && officialStart ? e.date >= officialStart : true))
    .sort((a, b) => (a.date === b.date ? b.startTime.localeCompare(a.startTime) : b.date.localeCompare(a.date)));

  // Grupper i dage (bevarer rækkefølgen fra det sorterede array).
  const days: { date: string; entries: WithId<TimeEntry>[] }[] = [];
  for (const e of visible) {
    const last = days[days.length - 1];
    if (last && last.date === e.date) last.entries.push(e);
    else days.push({ date: e.date, entries: [e] });
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Timetracker</AppText>
        <View className="flex-row items-center gap-2">
          <Link href="/timetracker/settings" asChild>
            <Button title="Startdato" variant="secondary" className="h-10 px-4" />
          </Link>
          <Link href="/timetracker/new" asChild>
            <Button title="Tilføj" className="h-10 px-4" />
          </Link>
        </View>
      </View>

      {fromCache ? <AppText variant="muted">Offline – viser gemte data</AppText> : null}

      <Segmented<TimeRange> value={range} options={RANGE_OPTIONS} onChange={setRange} />

      {officialStart ? (
        <View className="flex-row items-center justify-between">
          <AppText variant="muted">Vis kun efter officiel projektstart</AppText>
          <Switch value={onlyAfterOfficial} onValueChange={setOnlyAfterOfficial} />
        </View>
      ) : null}

      {visible.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen registreringer"
            description="Tilføj din første tidsregistrering for at se overblikket."
          />
        )
      ) : (
        <>
          <TimetrackerSummary entries={visible} />
          {days.map((day) => (
            <DayGroup key={day.date} date={day.date} entries={day.entries} />
          ))}
        </>
      )}
    </Screen>
  );
}
