import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Pressable, Text, View } from '@/tw';

/** Redigér valgmulighederne for et checklist-/choice-felt (tilføj/ret/fjern). */
export function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const update = (i: number, v: string) => onChange(options.map((o, idx) => (idx === i ? v : o)));
  const remove = (i: number) => onChange(options.filter((_, idx) => idx !== i));
  const add = () => onChange([...options, '']);

  return (
    <View className="gap-2">
      <AppText variant="muted">Valgmuligheder</AppText>
      {options.map((o, i) => (
        <View key={i} className="flex-row items-center gap-2">
          <Input
            value={o}
            onChangeText={(v) => update(i, v)}
            placeholder={`Valg ${i + 1}`}
            className="flex-1"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => remove(i)}
            hitSlop={6}
            className="px-2 py-2">
            <Text className="text-fg-muted">✕</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={add}
        className="self-start rounded-lg border border-border px-3 py-2 hover:bg-element">
        <Text className="text-sm text-primary">+ Tilføj valg</Text>
      </Pressable>
    </View>
  );
}
