import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Pressable, Switch, View } from '@/tw';
import type { OwnAccount } from '../types';

/**
 * Konti fra dine importer: navngiv dem og marker dine egne som “Intern konto”, så
 * overførsler til/fra dem ikke tæller som forbrug (matches sikkert på kontonummer).
 * Kontrolleret komponent — gemmes via den fælles Gem-knap på indstillingssiden.
 */
export function OwnAccountEditor({
  value,
  onChange,
}: {
  value: OwnAccount[];
  onChange: (next: OwnAccount[]) => void;
}) {
  const update = (i: number, patch: Partial<OwnAccount>) =>
    onChange(value.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { number: '', name: '', internal: true }]);

  return (
    <Card className="gap-3">
      <AppText variant="label">Mine konti</AppText>
      {value.length === 0 ? (
        <AppText variant="muted">Ingen konti endnu — importér en CSV, så dukker de op her.</AppText>
      ) : null}

      {value.map((a, i) => (
        <View key={i} className="gap-2 border-b border-border pb-3">
          <View className="flex-row items-center justify-between">
            <AppText variant="muted">Konto-nr.</AppText>
            <Pressable accessibilityRole="button" onPress={() => remove(i)} hitSlop={8}>
              <AppText className="text-sm text-danger">Fjern</AppText>
            </Pressable>
          </View>
          <Input
            value={a.number}
            onChangeText={(t) => update(i, { number: t })}
            placeholder="fx 54950001027564"
            keyboardType="number-pad"
          />
          <Input
            value={a.name}
            onChangeText={(t) => update(i, { name: t })}
            placeholder="Navn (fx Madkonto)"
          />
          <View className="flex-row items-center justify-between">
            <AppText variant="label">Intern konto (min egen)</AppText>
            <Switch value={a.internal} onValueChange={(internal) => update(i, { internal })} />
          </View>
        </View>
      ))}

      <Button title="Tilføj konto" variant="secondary" onPress={add} />
    </Card>
  );
}
