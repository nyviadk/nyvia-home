import { useState } from 'react';
import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { ListGate } from '@/components/ui/list-gate';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Switch, View } from '@/tw';
import { TimeEntryRow } from '../components/time-entry-row';
import { TimetrackerSummary } from '../components/timetracker-summary';
import { erTransport } from '../data/categories';
import { useTimetrackerSettingsStore } from '../data/timetracker-settings-store';
import { useTimetrackerStore } from '../data/timetracker-store';
import {
  formatDuration,
  rangeLabel,
  rangeOptions,
  rangeStartDate,
  type TimeMode,
  type TimeRange,
} from '../time.utils';
import type { TimeEntry } from '../types';
import { workMinutes } from '../work-time';

/**
 * Dagens arbejdstid (overlap talt én gang). Dagen er postens STARTdag, så natarbejde der
 * overlapper næste dags poster tælles på begge dage — oversigtens periodetal er det præcise.
 */
function DayGroup({ date, entries }: { date: string; entries: WithId<TimeEntry>[] }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="heading" className="capitalize">
          {formatDateCopenhagen(`${date}T00:00:00`)}
        </AppText>
        <AppText variant="muted">{formatDuration(workMinutes(entries))} arbejdstid</AppText>
      </View>
      {entries.map((entry) => (
        <TimeEntryRow key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

export function TimetrackerScreen() {
  const [range, setRange] = useState<TimeRange>('7d');
  /**
   * Rullende eller faste perioder — samme fire trin, to betydninger.
   *
   * Starter på `fast`, fordi det almindelige spørgsmål er "hvor meget har jeg arbejdet i
   * DENNE uge". Trinnet bliver stående når man slår om, så man lander samme sted i den
   * anden udgave i stedet for at skulle finde det igen.
   */
  const [mode, setMode] = useState<TimeMode>('fast');
  const [onlyAfterOfficial, setOnlyAfterOfficial] = useState(false);
  // Vis kun åbne (uden sluttid) — ignorerer tidsfilteret, så ingen gemmer sig.
  const [onlyOpen, setOnlyOpen] = useState(false);
  /**
   * Transport tælles med i registreringen, men sjældent i timerne.
   *
   * Slået TIL som standard: det almindelige spørgsmål er "hvor mange timer har jeg
   * arbejdet", og dér er kørslen støj. Den bliver stadig logget og kan hentes frem — det er
   * kun visningen der filtrerer, aldrig data.
   */
  const [udenTransport, setUdenTransport] = useState(true);

  const entries = useTimetrackerStore.useVisibleItems();
  const loading = useTimetrackerStore((s) => s.loading);
  const fromCache = useTimetrackerStore((s) => s.fromCache);
  const pendingIds = useTimetrackerStore.pending.useStore((s) => s.ids);
  const officialStart = useTimetrackerSettingsStore((s) => s.officialStartDate);

  const rangeStart = rangeStartDate(range, mode);
  const openCount = entries.filter((e) => !pendingIds.has(e.id) && !e.endTime).length;
  const iPerioden = entries
    .filter((e) => !pendingIds.has(e.id))
    .filter((e) => (onlyOpen ? !e.endTime : rangeStart === null ? true : e.date >= rangeStart))
    .filter((e) => (onlyAfterOfficial && officialStart ? e.date >= officialStart : true));

  // Hvor meget filteret skjuler — vises på kontakten, så man kan se hvad man har fravalgt
  // uden at slå det til og fra for at finde ud af det.
  const transportMinutter = iPerioden
    .filter(erTransport)
    .reduce((sum, e) => sum + e.durationMinutes, 0);

  const visible = (udenTransport ? iPerioden.filter((e) => !erTransport(e)) : iPerioden).sort(
    (a, b) => (a.date === b.date ? b.startTime.localeCompare(a.startTime) : b.date.localeCompare(a.date))
  );

  // Grupper i dage (bevarer rækkefølgen fra det sorterede array).
  const days: { date: string; entries: WithId<TimeEntry>[] }[] = [];
  for (const e of visible) {
    const last = days[days.length - 1];
    if (last && last.date === e.date) last.entries.push(e);
    else days.push({ date: e.date, entries: [e] });
  }

  return (
    <Screen>
      <ScreenHeader title="Timetracker" addHref="/timetracker/new">
        <Link href="/timetracker/settings" asChild>
          <Button title="Startdato" variant="secondary" className="h-10 px-4" />
        </Link>
      </ScreenHeader>

      <OfflineNotice fromCache={fromCache} />

      {/* Oversigt øverst */}
      {visible.length > 0 ? (
        <TimetrackerSummary entries={visible} periode={rangeLabel(range, mode)} />
      ) : null}

      {/* Filtre under oversigten */}
      <Segmented<TimeRange> value={range} options={rangeOptions(mode)} onChange={setRange} />

      {/* Etiketterne på knapperne ovenfor skifter med kontakten, så man kan se hvad man har
          valgt uden at læse en forklaring. Hvad perioden dækker i datoer, står på
          oversigten øverst. */}
      <View className="flex-row items-center justify-between">
        <AppText variant="muted" className={mode === 'fast' ? 'text-accent-moving' : undefined}>
          Faste perioder (kalenderens uge, måned, år)
        </AppText>
        <Switch value={mode === 'fast'} onValueChange={(v) => setMode(v ? 'fast' : 'rullende')} />
      </View>

      {onlyOpen || openCount > 0 ? (
        <View className="flex-row items-center justify-between">
          <AppText variant="muted" className={onlyOpen ? 'text-accent-moving' : undefined}>
            Kun uden sluttid ({openCount})
          </AppText>
          <Switch value={onlyOpen} onValueChange={setOnlyOpen} />
        </View>
      ) : null}

      {/* Står altid, også når der ikke er transport i perioden — ellers ville man ikke kunne
          se AT timerne er filtreret, og et tal uden en forklaring er værre end ingen. */}
      <View className="flex-row items-center justify-between">
        <AppText variant="muted" className={udenTransport ? 'text-accent-moving' : undefined}>
          Uden transport{transportMinutter > 0 ? ` (${formatDuration(transportMinutter)})` : ''}
        </AppText>
        <Switch value={udenTransport} onValueChange={setUdenTransport} />
      </View>

      {officialStart ? (
        <View className="flex-row items-center justify-between">
          <AppText variant="muted">Vis kun efter officiel projektstart</AppText>
          <Switch value={onlyAfterOfficial} onValueChange={setOnlyAfterOfficial} />
        </View>
      ) : null}

      {/* Liste */}
      <ListGate
        count={visible.length}
        loading={loading}
        empty={{
          title: onlyOpen ? 'Ingen åbne registreringer' : 'Ingen registreringer',
          description: onlyOpen
            ? 'Alle registreringer har en sluttid.'
            : 'Tilføj din første tidsregistrering for at se overblikket.',
        }}>
        {days.map((day) => (
          <DayGroup key={day.date} date={day.date} entries={day.entries} />
        ))}
      </ListGate>
    </Screen>
  );
}
