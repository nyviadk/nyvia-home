import { Link } from 'expo-router';
import { DateTime } from 'luxon';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { APP_TIMEZONE } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { Pressable, View } from '@/tw';
import { assess, sumTotals } from '../balance';
import { DayHead } from '../components/day-head';
import { MealSection } from '../components/meal-section';
import { WeekBars } from '../components/week-bars';
import {
  addLogEntry,
  deleteEntries,
  deleteLogEntry,
  setLogQty,
} from '../data/protein.repository';
import { useFoodsStore, useLogStore, useProteinSettingsStore } from '../data/protein-stores';
import { currentMeal, dayKey, dayLabel } from '../day';
import { MEAL_SLOTS, serving, type ProteinFood, type ProteinLogEntry } from '../types';

export function ProteinScreen() {
  const [day, setDay] = useState(dayKey);

  const entries = useLogStore.useVisibleItems();
  const foods = useFoodsStore.useVisibleItems();
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

  const addFood = (food: WithId<ProteinFood>) => {
    const per = serving(food);
    void addLogEntry({
      day,
      name: food.name,
      proteinG: per.proteinG,
      kcal: per.kcal,
      qty: 1,
      meal: food.meal,
      foodId: food.id,
    });
  };

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

  /**
   * `−` trækker én portion fra. Er det den sidste, forsvinder posten.
   *
   * Ingen bekræftelse her: det er en tælleknap, ikke en sletning. Trykker man forkert,
   * trykker man `+` igen — modsat de rigtige slet-handlinger, hvor man mister noget man
   * ikke kan skrive tilbage på et sekund.
   */
  const removeOne = (entry: WithId<ProteinLogEntry>) => {
    if (entry.qty > 1) void setLogQty(entry.id, entry.qty - 1);
    else void deleteLogEntry(entry.id);
  };

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

  const hasSomething = foods.length > 0 || ofDay.length > 0;

  return (
    <Screen>
      <OfflineNotice fromCache={fromCache} />

      <DayHead
        day={day}
        isToday={isToday}
        onShiftDay={shiftDay}
        totals={totals}
        proteinGoal={proteinGoalG}
        kcalGoal={kcalGoalKcal}
        assessment={assessment}
      />

      {MEAL_SLOTS.map((slot) => (
        <MealSection
          key={slot.value}
          slot={slot.value}
          foods={foods}
          entries={ofDay}
          onAdd={addFood}
          onRemoveOne={removeOne}
        />
      ))}

      {!hasSomething && !loading ? (
        <View className="gap-2 pt-6">
          <AppText variant="label">Ingen retter endnu</AppText>
          <AppText variant="muted" className="text-sm leading-relaxed">
            Opret de retter du spiser jævnligt. Så står de her under deres måltid, og et tryk
            tæller dem med.
          </AppText>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between gap-3 border-t border-border pt-5">
        <Link href="/protein/foods/new" asChild>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <AppText className="text-xs font-semibold uppercase tracking-widest text-primary">
              + Tilføj egen ret
            </AppText>
          </Pressable>
        </Link>
        <Button title="+ Ukendt måltid" variant="secondary" className="h-9 px-3" onPress={logUnknown} />
      </View>

      <WeekBars
        entries={entries}
        proteinGoal={proteinGoalG}
        kcalGoal={kcalGoalKcal}
        selected={day}
        onSelect={setDay}
      />

      <View className="flex-row items-center justify-between pt-2">
        <Link href="/protein/foods" asChild>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <AppText variant="muted" className="text-xs uppercase tracking-widest">
              Katalog
            </AppText>
          </Pressable>
        </Link>
        <Link href="/protein/settings" asChild>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <AppText variant="muted" className="text-xs uppercase tracking-widest">
              Mål
            </AppText>
          </Pressable>
        </Link>
        {ofDay.length > 0 ? (
          <Pressable accessibilityRole="button" hitSlop={6} onPress={clearDay}>
            <AppText variant="muted" className="text-xs uppercase tracking-widest">
              Ryd dagen
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View
        className="mt-4 gap-2 rounded-r-lg border-l-2 border-l-accent-protein bg-accent-protein/5 p-3">
        <AppText variant="muted" className="text-[13px] leading-relaxed">
          Cirka-tal, ikke facit. Rammer du klodserne de fleste dage, er protein i hus —
          ugegennemsnittet tæller, ikke den enkelte dag.
        </AppText>
      </View>
    </Screen>
  );
}
