import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { deleteLogEntry, updateLogEntry } from '../data/protein.repository';
import { useLogStore } from '../data/protein-stores';
import { dayLabel } from '../day';
import { MEAL_SLOTS, type MealSlot } from '../types';

const digits = (v: string) => v.replace(/[^0-9]/g, '');
const decimals = (v: string) => v.replace(/[^0-9.,]/g, '');
const toNum = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Redigér en logget post.
 *
 * Tallene kan rettes frit, også på poster der kom fra kataloget. Det er dét der gør
 * "ukendt måltid" og skøn brugbare: man kan slå ned på en enkelt post bagefter uden at
 * skulle oprette en ret først, og uden at ændre noget for de andre dage.
 */
export function LogEntryScreen({ id }: { id: string }) {
  const { item, loading } = useLogStore.useItem(id);

  const [name, setName] = useState(item?.name ?? '');
  const [protein, setProtein] = useState(item ? String(item.proteinG) : '');
  const [kcal, setKcal] = useState(item ? String(item.kcal) : '');
  const [qty, setQty] = useState(item ? String(item.qty) : '1');
  const [meal, setMeal] = useState<MealSlot>(item?.meal ?? 'snack');
  const [saving, setSaving] = useState(false);

  if (!item) {
    return loading ? (
      <LoadingScreen />
    ) : (
      <Screen>
        <AppText variant="muted">Posten findes ikke længere.</AppText>
      </Screen>
    );
  }

  const parsedQty = Math.max(1, toNum(qty) || 1);
  const valid = name.trim().length > 0;

  const save = async () => {
    setSaving(true);
    try {
      await updateLogEntry(id, {
        day: item.day,
        name: name.trim(),
        proteinG: toNum(protein),
        kcal: toNum(kcal),
        qty: parsedQty,
        meal,
        ...(item.tags?.length ? { tags: item.tags } : {}),
        ...(item.foodId ? { foodId: item.foodId } : {}),
        // Skønnet er ikke længere et skøn når man selv har rettet i tallene.
        ...(item.estimated && toNum(protein) === item.proteinG && toNum(kcal) === item.kcal
          ? { estimated: true }
          : {}),
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Redigér post</AppText>
      <AppText variant="muted">{dayLabel(item.day)}</AppText>

      <FormField label="Navn">
        <Input value={name} onChangeText={setName} placeholder="Hvad var det?" />
      </FormField>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Protein pr. portion">
            <Input
              value={protein}
              onChangeText={(v) => setProtein(decimals(v))}
              keyboardType="decimal-pad"
              placeholder="g"
            />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Kcal pr. portion">
            <Input
              value={kcal}
              onChangeText={(v) => setKcal(digits(v))}
              keyboardType="number-pad"
              placeholder="kcal"
            />
          </FormField>
        </View>
      </View>

      <FormField label="Antal portioner">
        <Input
          value={qty}
          onChangeText={(v) => setQty(digits(v))}
          keyboardType="number-pad"
          placeholder="1"
        />
      </FormField>

      <View className="gap-1.5 rounded-xl bg-element p-3">
        <AppText variant="muted" className="text-xs uppercase">
          Posten tæller som
        </AppText>
        <AppText className="text-xl font-semibold text-fg">
          {Math.round(toNum(protein) * parsedQty * 10) / 10} g protein ·{' '}
          {Math.round(toNum(kcal) * parsedQty)} kcal
        </AppText>
      </View>

      <FormField label="Måltid">
        <Segmented<MealSlot> value={meal} options={MEAL_SLOTS} onChange={setMeal} />
      </FormField>

      <Button title="Gem" disabled={!valid} loading={saving} onPress={() => void save()} />

      <DeleteEntityLink
        id={id}
        label="Fjern post"
        name={item.name}
        pending={useLogStore.pending}
        remove={() => deleteLogEntry(id)}
      />
    </Screen>
  );
}
