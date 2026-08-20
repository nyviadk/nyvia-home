import { Link } from 'expo-router';
import { DateTime } from 'luxon';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { APP_TIMEZONE } from '@/lib/datetime';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { Pressable, View } from '@/tw';
import { assess, sumTotals } from '../balance';
import { BalanceCard } from '../components/balance-card';
import { GoalMeter } from '../components/goal-meter';
import { LogRow } from '../components/log-row';
import { WeekBars } from '../components/week-bars';
import { addLogEntry, deleteEntries, deleteLogEntry, setLogQty } from '../data/protein.repository';
import { useLogStore, useProteinSettingsStore } from '../data/protein-stores';
import { currentMeal, dayKey, dayLabel } from '../day';
import { MEAL_SLOTS, mealLabel } from '../types';

export function ProteinScreen() {
  const [day, setDay] = useState(dayKey);

  const entries = useLogStore.useVisibleItems();
  const loading = useLogStore((s) => s.loading);
  const fromCache = useLogStore((s) => s.fromCache);
  const proteinGoalG = useProteinSettingsStore((s) => s.proteinGoalG);
  const kcalGoalKcal = useProteinSettingsStore((s) => s.kcalGoalKcal);
  const unknownProteinG = useProteinSettingsStore((s) => s.unknownProteinG);
  const unknownKcal = useProteinSettingsStore((s) => s.unknownKcal);

  const ofDay = entries.filter((e) => e.day === day);
  const totals = sumTotals(ofDay);
  const assessment = assess(totals, {
    proteinGoalG,
    kcalGoalKcal,
    unknownProteinG,
    unknownKcal,
    updatedAt: '',
  });

  const shiftDay = (days: number) =>
    setDay((d) => dayKey(DateTime.fromISO(d, { zone: APP_TIMEZONE }).plus({ days })));
  const isToday = day === dayKey();

  /**
   * Ét tryk = ét måltid. Måltidet gættes ud fra klokken, og tallene kommer fra
   * indstillingerne — skulle man vælge sektion og skrive tal, var knappen ikke hurtigere
   * end at oprette en ret, og så ville den ikke blive brugt.
   */
  const logUnknown = () =>
    void addLogEntry({
      day,
      name: 'Ukendt måltid',
      proteinG: unknownProteinG,
      kcal: unknownKcal,
      qty: 1,
      meal: currentMeal(),
      estimated: true,
    });

  const clearDay = () =>
    void confirmDelete({
      title: 'Ryd dagen',
      name: dayLabel(day).toLowerCase(),
      message: `Fjern alle ${ofDay.length} poster fra ${dayLabel(day).toLowerCase()}?`,
      confirmLabel: 'Ryd',
      toast: 'Dagen ryddet',
      markPending: () => useLogStore.pending.mark(ofDay.map((e) => e.id)),
      unmarkPending: () => useLogStore.pending.unmark(ofDay.map((e) => e.id)),
      remove: () => deleteEntries(ofDay.map((e) => e.id)),
    });

  const removeEntry = (id: string, name: string) =>
    void confirmDelete({
      title: 'Fjern post',
      name,
      markPending: () => useLogStore.pending.mark(id),
      unmarkPending: () => useLogStore.pending.unmark(id),
      remove: () => deleteLogEntry(id),
    });

  return (
    <Screen>
      <ScreenHeader title="Protein" addHref="/protein/foods" addLabel="Katalog">
        <Link href="/protein/settings" asChild>
          <Button title="Mål" variant="secondary" className="h-10 px-4" />
        </Link>
      </ScreenHeader>

      <OfflineNotice fromCache={fromCache} />

      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forrige dag"
          hitSlop={8}
          onPress={() => shiftDay(-1)}
          className="h-9 w-9 items-center justify-center rounded-lg bg-element active:opacity-70">
          <AppText className="text-lg leading-none text-fg">{'\u2039'}</AppText>
        </Pressable>
        <AppText variant="label">{dayLabel(day)}</AppText>
        {/* Fremad er spærret på dagen i dag: man logger ikke mad man ikke har spist. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Næste dag"
          hitSlop={8}
          disabled={isToday}
          onPress={() => shiftDay(1)}
          className="h-9 w-9 items-center justify-center rounded-lg bg-element active:opacity-70">
          <AppText className={isToday ? 'text-lg leading-none text-fg-muted' : 'text-lg leading-none text-fg'}>
            {'\u203A'}
          </AppText>
        </Pressable>
      </View>

      <Card>
        <View className="flex-row gap-5">
          <GoalMeter label="Protein" value={totals.proteinG} goal={proteinGoalG} unit="g" tone="protein" />
          <GoalMeter
            label="Kalorier"
            value={totals.kcal}
            goal={kcalGoalKcal}
            unit="kcal"
            tone={assessment.state === 'over-kcal' ? 'over' : 'kcal'}
          />
        </View>
      </Card>

      <BalanceCard assessment={assessment} />

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button title="+ Ukendt måltid" variant="secondary" onPress={logUnknown} />
        </View>
        <View className="flex-1">
          <Link href="/protein/foods" asChild>
            <Button title="Fra kataloget" />
          </Link>
        </View>
      </View>

      {ofDay.length === 0 ? (
        loading ? null : (
          <AppText variant="muted" className="py-6 text-center">
            Intet logget {dayLabel(day).toLowerCase()}.
          </AppText>
        )
      ) : (
        MEAL_SLOTS.map((slot) => {
          const rows = ofDay.filter((e) => e.meal === slot.value);
          if (rows.length === 0) return null;
          const sub = sumTotals(rows);
          return (
            <View key={slot.value} className="gap-1">
              <View className="flex-row items-baseline justify-between">
                <AppText variant="muted" className="text-xs uppercase">
                  {mealLabel(slot.value)}
                </AppText>
                <AppText variant="muted" className="text-xs">
                  {Math.round(sub.proteinG)} g · {Math.round(sub.kcal)} kcal
                </AppText>
              </View>
              {rows.map((entry) => (
                <LogRow
                  key={entry.id}
                  entry={entry}
                  onQty={(qty) => void setLogQty(entry.id, qty)}
                  onDelete={() => removeEntry(entry.id, entry.name)}
                />
              ))}
            </View>
          );
        })
      )}

      <WeekBars entries={entries} goal={proteinGoalG} selected={day} onSelect={setDay} />

      {ofDay.length > 0 ? (
        <View className="items-center">
          <Button title="Ryd dagen" variant="ghost" onPress={clearDay} />
        </View>
      ) : null}
    </Screen>
  );
}
