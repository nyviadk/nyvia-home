import { Link } from 'expo-router';
import { useState } from 'react';

import { DeleteRowButton } from '@/components/ui/delete-row-button';
import { Input } from '@/components/ui/input';
import { ListGate } from '@/components/ui/list-gate';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import { deleteFood, setFoodHidden } from '../data/protein.repository';
import { useFoodsStore } from '../data/protein-stores';
import { MEAL_SLOTS, mealLabel, portionLabel, serving } from '../types';

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Kataloget — her VEDLIGEHOLDER man sine retter; man logger dem på forsiden.
 *
 * De to ting lå før i samme liste, og så måtte man vælge hvilken der skulle være det
 * lette tryk: det hyppige (logge) eller det sjældne (rette). Nu er der ét sted til hver,
 * og skjul/slet står kun her, hvor man ikke står midt i at spise.
 */
export function FoodsScreen() {
  const foods = useFoodsStore.useVisibleItems();
  const loading = useFoodsStore((s) => s.loading);
  const [query, setQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const q = norm(query);
  const hiddenCount = foods.filter((f) => f.hidden).length;
  const visible = foods
    .filter((f) => showHidden || !f.hidden)
    .filter((f) => !q || norm(f.name).includes(q));

  return (
    <Screen>
      <ScreenHeader title="Katalog" addHref="/protein/foods/new" addLabel="Ny ret" />

      {foods.length > 0 ? (
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Søg…"
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : null}

      {hiddenCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => setShowHidden((v) => !v)}
          className="self-start">
          <AppText className="text-sm text-primary">
            {showHidden ? 'Skjul dem igen' : `Vis ${hiddenCount} skjulte`}
          </AppText>
        </Pressable>
      ) : null}

      <ListGate
        count={visible.length}
        loading={loading}
        empty={{
          title: q ? 'Ingen træffere' : 'Kataloget er tomt',
          description: q
            ? 'Prøv et andet ord.'
            : 'Opret de retter du rent faktisk spiser — så passer tallene også.',
        }}>
        {MEAL_SLOTS.map((slot) => {
          const rows = visible.filter((f) => f.meal === slot.value);
          if (rows.length === 0) return null;
          return (
            <View key={slot.value} className="gap-1 pb-4">
              <AppText variant="muted" className="text-xs uppercase">
                {mealLabel(slot.value)}
              </AppText>
              {rows.map((food) => {
                const per = serving(food);
                const portion = portionLabel(food);
                return (
                  <View
                    key={food.id}
                    className={cn(
                      'flex-row items-center gap-3 border-b border-border py-3',
                      food.hidden && 'opacity-50'
                    )}>
                    <Link
                      href={{ pathname: '/protein/foods/[id]', params: { id: food.id } }}
                      asChild>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Redigér ${food.name}`}
                        className="flex-1 gap-0.5 active:opacity-60">
                        <AppText variant="label" numberOfLines={2}>
                          {food.name}
                        </AppText>
                        <AppText variant="muted" className="text-xs">
                          {portion ? `${portion} · ` : ''}
                          {per.proteinG} g protein · {per.kcal} kcal
                        </AppText>
                      </Pressable>
                    </Link>

                    {/* Skjul frem for slet: en ret man ikke spiser i denne periode er ikke
                        det samme som en ret man aldrig får brug for igen. */}
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => void setFoodHidden(food.id, !food.hidden)}>
                      <AppText className="text-sm text-primary">
                        {food.hidden ? 'Vis' : 'Skjul'}
                      </AppText>
                    </Pressable>

                    <DeleteRowButton
                      id={food.id}
                      title="Slet ret"
                      name={food.name}
                      pending={useFoodsStore.pending}
                      remove={() => deleteFood(food.id)}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </ListGate>
    </Screen>
  );
}
