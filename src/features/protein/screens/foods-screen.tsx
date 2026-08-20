import { Link, router } from 'expo-router';
import { useState } from 'react';

import { DeleteRowButton } from '@/components/ui/delete-row-button';
import { Input } from '@/components/ui/input';
import { ListGate } from '@/components/ui/list-gate';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { notify } from '@/lib/toast/notify';
import { Pressable, View } from '@/tw';
import { addLogEntry, deleteFood, setFoodHidden } from '../data/protein.repository';
import { useFoodsStore } from '../data/protein-stores';
import { currentMeal, dayKey } from '../day';
import { portionLabel, serving, type ProteinFood } from '../types';

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Kataloget. Et tryk på en ret logger den på i dag — det er dét man er her for; redigering
 * og skjul ligger bagved, så den hyppige handling er den billigste.
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

  const log = (food: ProteinFood & { id: string }) => {
    const { proteinG, kcal } = serving(food);
    void addLogEntry({
      day: dayKey(),
      name: food.name,
      proteinG,
      kcal,
      qty: 1,
      meal: currentMeal(),
      foodId: food.id,
      ...(food.tags?.length ? { tags: food.tags } : {}),
    });
    notify(`${food.name} logget`);
    router.back();
  };

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
        <View>
          {visible.map((food) => {
            const per = serving(food);
            const portion = portionLabel(food);
            return (
              <View
                key={food.id}
                className={cn(
                  'flex-row items-center gap-3 border-b border-border py-3',
                  food.hidden && 'opacity-50'
                )}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Log ${food.name}`}
                  onPress={() => log(food)}
                  className="flex-1 gap-0.5 active:opacity-60">
                  <AppText variant="label" numberOfLines={2}>
                    {food.name}
                  </AppText>
                  <AppText variant="muted" className="text-xs">
                    {portion ? `${portion} · ` : ''}
                    {per.proteinG} g protein · {per.kcal} kcal
                  </AppText>
                </Pressable>

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

                <Link href={{ pathname: '/protein/foods/[id]', params: { id: food.id } }} asChild>
                  <Pressable accessibilityRole="button" hitSlop={8}>
                    <AppText className="text-sm text-primary">Redigér</AppText>
                  </Pressable>
                </Link>

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
      </ListGate>

    </Screen>
  );
}
