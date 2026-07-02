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
  { value: '7d' as const, label: '7 dage' },
  { value: '31d' as const, label: '31 dage' },
  { value: '365d' as const, label: '365 dage' },
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
  const [range, setRange] = useState<TimeRange>('7d');
  const [onlyAfterOfficial, setOnlyAfterOfficial] = useState(false);
  // Vis kun åbne (uden sluttid) — ignorerer tidsfilteret, så ingen gemmer sig.
  const [onlyOpen, setOnlyOpen] = useState(false);

  const entries = useTimetrackerStore((s) => s.entries);
  const loading = useTimetrackerStore((s) => s.loading);
  const fromCache = useTimetrackerStore((s) => s.fromCache);
  const pendingIds = usePendingTimeDeletes((s) => s.ids);
  const officialStart = useTimetrackerSettingsStore((s) => s.officialStartDate);

  const rangeStart = rangeStartDate(range);
  const openCount = entries.filter((e) => !pendingIds.has(e.id) && !e.endTime).length;
  const visible = entries
    .filter((e) => !pendingIds.has(e.id))
    .filter((e) => (onlyOpen ? !e.endTime : rangeStart === null ? true : e.date >= rangeStart))
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

      {/* Oversigt øverst */}
      {visible.length > 0 ? <TimetrackerSummary entries={visible} /> : null}

      {/* Filtre under oversigten */}
      <Segmented<TimeRange> value={range} options={RANGE_OPTIONS} onChange={setRange} />

      {onlyOpen || openCount > 0 ? (
        <View className="flex-row items-center justify-between">
          <AppText variant="muted" className={onlyOpen ? 'text-accent-moving' : undefined}>
            Kun uden sluttid ({openCount})
          </AppText>
          <Switch value={onlyOpen} onValueChange={setOnlyOpen} />
        </View>
      ) : null}

      {officialStart ? (
        <View className="flex-row items-center justify-between">
          <AppText variant="muted">Vis kun efter officiel projektstart</AppText>
          <Switch value={onlyAfterOfficial} onValueChange={setOnlyAfterOfficial} />
        </View>
      ) : null}

      {/* Liste */}
      {visible.length === 0 ? (
        loading ? null : (
          <EmptyState
            title={onlyOpen ? 'Ingen åbne registreringer' : 'Ingen registreringer'}
            description={
              onlyOpen
                ? 'Alle registreringer har en sluttid.'
                : 'Tilføj din første tidsregistrering for at se overblikket.'
            }
          />
        )
      ) : (
        days.map((day) => (
          <DayGroup key={day.date} date={day.date} entries={day.entries} />
        ))
      )}
    </Screen>
  );
}
