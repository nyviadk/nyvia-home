import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { saveProteinSettings } from '../data/protein.repository';
import { useProteinSettingsStore } from '../data/protein-stores';
import { DEFAULT_SETTINGS } from '../types';

const digits = (v: string) => v.replace(/[^0-9]/g, '');
const toInt = (v: string, fallback: number) => (v === '' ? fallback : Number(v));

/**
 * Målene. De står i appen og ikke i koden, fordi de er personlige og ændrer sig med vægt,
 * træning og hvor stort et underskud man kører med.
 */
export function ProteinSettingsScreen() {
  const proteinGoal = useProteinSettingsStore((s) => s.proteinGoalG);
  const kcalGoal = useProteinSettingsStore((s) => s.kcalGoalKcal);
  const storedUnknownProtein = useProteinSettingsStore((s) => s.unknownProteinG);
  const storedUnknownKcal = useProteinSettingsStore((s) => s.unknownKcal);

  const [protein, setProtein] = useState(String(proteinGoal));
  const [kcal, setKcal] = useState(String(kcalGoal));
  const [unknownProtein, setUnknownProtein] = useState(String(storedUnknownProtein));
  const [unknownKcal, setUnknownKcal] = useState(String(storedUnknownKcal));
  const [saving, setSaving] = useState(false);

  const values = {
    proteinGoalG: toInt(protein, DEFAULT_SETTINGS.proteinGoalG),
    kcalGoalKcal: toInt(kcal, DEFAULT_SETTINGS.kcalGoalKcal),
    unknownProteinG: toInt(unknownProtein, DEFAULT_SETTINGS.unknownProteinG),
    unknownKcal: toInt(unknownKcal, DEFAULT_SETTINGS.unknownKcal),
  };

  const valid = values.proteinGoalG > 0 && values.kcalGoalKcal > 0;

  const save = async () => {
    setSaving(true);
    try {
      await saveProteinSettings(values);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Mål</AppText>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Protein pr. dag">
            <Input
              value={protein}
              onChangeText={(v) => setProtein(digits(v))}
              keyboardType="number-pad"
              placeholder="g"
            />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Kalorier pr. dag">
            <Input
              value={kcal}
              onChangeText={(v) => setKcal(digits(v))}
              keyboardType="number-pad"
              placeholder="kcal"
            />
          </FormField>
        </View>
      </View>

      <View className="gap-2 pt-2">
        <AppText variant="label">Ukendt måltid</AppText>
        <AppText variant="muted" className="text-sm leading-relaxed">
          Tallene bag hurtig-knappen, til mad du ikke selv har lavet og ikke gider regne på.
          Sæt dem lidt lavt på protein og lidt højt på kalorier — gætter du forkert, er det
          den fejl der trækker dig i den rigtige retning.
        </AppText>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Protein">
              <Input
                value={unknownProtein}
                onChangeText={(v) => setUnknownProtein(digits(v))}
                keyboardType="number-pad"
                placeholder="g"
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="Kalorier">
              <Input
                value={unknownKcal}
                onChangeText={(v) => setUnknownKcal(digits(v))}
                keyboardType="number-pad"
                placeholder="kcal"
              />
            </FormField>
          </View>
        </View>
      </View>

      <Button title="Gem" disabled={!valid} loading={saving} onPress={() => void save()} />
    </Screen>
  );
}
