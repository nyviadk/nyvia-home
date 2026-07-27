import { AppText } from '@/components/ui/text';
import { TextInput, View } from '@/tw';

/** Kanonisk PROD-ID af det tal man taster: "214" → "PROD-214". Tomt → "". */
export const canonicalProdId = (num: string): string => {
  const n = num.trim();
  return n ? `PROD-${n}` : '';
};

/** Tallet ud af et gemt PROD-ID: "PROD-214" → "214". */
export const prodNumOf = (prodId?: string): string =>
  (prodId ?? '').replace(/^\s*prod[-\s]*/i, '').trim();

/**
 * Tekstfelt med fast "PROD-"-præfiks — man taster kun tallet. `value` er tallet (uden præfiks);
 * et evt. indsat "PROD-" strippes, så man aldrig ender med "PROD-PROD-214".
 */
export function ProdIdField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (num: string) => void;
}) {
  return (
    <View
      className="h-12 flex-1 flex-row items-center gap-1 rounded-xl border border-border bg-card px-4"
      style={{ borderCurve: 'continuous' }}>
      <AppText variant="muted">PROD-</AppText>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/^\s*prod[-\s]*/i, ''))}
        placeholder="214"
        placeholderTextColor="#a8a29a"
        className="flex-1 text-base text-fg"
        style={{ paddingVertical: 0 }}
      />
    </View>
  );
}
