import { AppText } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Pressable, View } from '@/tw';

export interface VariantRow {
  key: string;
  da: string;
  en: string;
}

/**
 * Varianterne på et punkt: samme faktum, forskellig vinkel.
 *
 * Redigeres som en LISTE og ikke som et map, selvom det gemmes som et map. Med et map
 * skulle man omdøbe nøgler på plads, og et halvt omdøbt navn ville ryge i databasen ved
 * hvert tastetryk. Listen konverteres først til et map når der gemmes.
 *
 * ⚠️ Varianter skrives ALTID som et helt objekt, aldrig med en dot-path-patch. At fjerne
 * en nøgle med dot-path kræver en `FieldValue.delete()`-sentinel, som `DbFacade` ikke har —
 * en fjernet variant ville blive hængende i dokumentet. Mønstret fra `setEviAnswer` ser ud
 * som det oplagte at kopiere, og er det ene sted det er forkert.
 */
export function VariantEditor({
  rows,
  onChange,
}: {
  rows: readonly VariantRow[];
  onChange: (next: VariantRow[]) => void;
}) {
  const patch = (i: number, part: Partial<VariantRow>) =>
    onChange(rows.map((row, j) => (j === i ? { ...row, ...part } : row)));

  return (
    <View className="gap-3">
      {rows.length === 0 ? (
        <AppText variant="muted" className="text-xs leading-relaxed">
          Samme faktum, forskellig vinkel. Navngiv dem frit — fx teknisk, forretning, kort,
          ledelse. Claude vælger vinklen ud fra jobopslaget.
        </AppText>
      ) : null}
      {rows.map((row, i) => (
        <View
          key={i}
          className="gap-2 rounded-xl border border-border p-3"
          style={{ borderCurve: 'continuous' }}>
          <View className="flex-row items-center gap-2">
            <Input
              value={row.key}
              onChangeText={(v) => patch(i, { key: v })}
              placeholder="teknisk"
              autoCapitalize="none"
              autoCorrect={false}
              className="h-10 flex-1"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Fjern varianten ${row.key || i + 1}`}
              hitSlop={8}
              onPress={() => onChange(rows.filter((_, j) => j !== i))}>
              <AppText className="text-sm text-danger">Fjern</AppText>
            </Pressable>
          </View>

          <Input
            value={row.da}
            onChangeText={(v) => patch(i, { da: v })}
            placeholder="Byggede envelope encryption med AES-256-GCM og Google Cloud KMS."
            multiline
            autoGrow
            className="h-auto min-h-16 py-2"
            style={{ textAlignVertical: 'top' }}
          />
          <Input
            value={row.en}
            onChangeText={(v) => patch(i, { en: v })}
            placeholder="Engelsk — lad stå tom hvis den er den samme"
            multiline
            autoGrow
            className="h-auto min-h-16 py-2"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => onChange([...rows, { key: '', da: '', en: '' }])}
        className="self-start">
        <AppText className="text-sm font-semibold text-primary">+ Tilføj variant</AppText>
      </Pressable>
    </View>
  );
}
