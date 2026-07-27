import { useRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Pressable, TextInput } from '@/tw';

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
  const ref = useRef<RNTextInput>(null);
  // Hele kassen (også "PROD-"-labelen og paddingen) fokuserer feltet — ikke kun selve inputtet.
  // `active:opacity-100` annullerer den normale tryk-fade, så et input ikke blinker ved tap.
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => ref.current?.focus()}
      className="h-14 flex-1 flex-row items-center gap-1 rounded-xl border border-border bg-card px-4 active:opacity-100"
      style={{ borderCurve: 'continuous' }}>
      <AppText variant="muted">PROD-</AppText>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/^\s*prod[-\s]*/i, ''))}
        placeholder="214"
        placeholderTextColor="#a8a29a"
        className="h-full flex-1 text-base text-fg"
      />
    </Pressable>
  );
}
