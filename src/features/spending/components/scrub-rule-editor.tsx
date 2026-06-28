import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { AppText } from '@/components/ui/text';
import { stableHashHex } from '@/lib/hash';
import { Pressable, View } from '@/tw';
import { SCRUB_COLUMNS, type ScrubColumn, type ScrubRule } from '../types';

/**
 * Rense-regler: "hvis {kolonne} indeholder {tekst} → erstat hele feltet med {ny tekst}".
 * Fx samler den varierende "Indbetaler"-adresser til ét navn. Kontrolleret komponent —
 * gemmes via den fælles Gem-knap på indstillingssiden.
 */
export function ScrubRuleEditor({
  value,
  onChange,
}: {
  value: ScrubRule[];
  onChange: (next: ScrubRule[]) => void;
}) {
  const update = (id: string, patch: Partial<ScrubRule>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(value.filter((r) => r.id !== id));
  const add = () =>
    onChange([
      ...value,
      {
        id: stableHashHex(`${Date.now()}-${value.length}`),
        column: 'payer',
        contains: '',
        replaceWith: '',
      },
    ]);

  return (
    <Card className="gap-3">
      <AppText variant="label">Rense-regler</AppText>
      {value.length === 0 ? <AppText variant="muted">Ingen regler endnu.</AppText> : null}

      {value.map((r) => (
        <View key={r.id} className="gap-2 border-b border-border pb-3" style={{ zIndex: 1 }}>
          <View className="flex-row items-center justify-between">
            <AppText variant="muted">Kolonne</AppText>
            <Pressable accessibilityRole="button" onPress={() => remove(r.id)} hitSlop={8}>
              <AppText className="text-sm text-danger">Fjern</AppText>
            </Pressable>
          </View>
          <SelectField<ScrubColumn>
            value={r.column}
            options={SCRUB_COLUMNS}
            onChange={(column) => update(r.id, { column })}
          />
          <Input
            value={r.contains}
            onChangeText={(t) => update(r.id, { contains: t })}
            placeholder="Indeholder… (fx navn)"
          />
          <Input
            value={r.replaceWith}
            onChangeText={(t) => update(r.id, { replaceWith: t })}
            placeholder="Erstat med…"
          />
        </View>
      ))}

      <Button title="Tilføj regel" variant="secondary" onPress={add} />
    </Card>
  );
}
