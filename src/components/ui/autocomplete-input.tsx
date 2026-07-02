import { useRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { Input } from '@/components/ui/input';
import { Pressable, Text, View } from '@/tw';

/**
 * Fri-tekst felt med auto-forslag ud fra tidligere tekst. Forslagene vises som INLINE chips
 * under feltet HELE TIDEN (ingen z-index/dropdown at slås med), og filtreres når man skriver.
 * Tryk på en chip udfylder + blur. Fx tomt felt → alle forslag; "rid" → kun "Ridse i bord".
 */
export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  suggestions: string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  const inputRef = useRef<RNTextInput>(null);

  const q = value.trim().toLowerCase();
  const matches = suggestions
    .filter((s) => (q ? s.toLowerCase().includes(q) : true) && s.toLowerCase() !== q)
    .slice(0, 8);

  return (
    <View className="gap-1.5">
      <Input
        ref={inputRef}
        value={value}
        invalid={invalid}
        placeholder={placeholder}
        onChangeText={onChange}
        autoCapitalize="sentences"
      />
      {matches.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {matches.map((s) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => {
                onChange(s);
                inputRef.current?.blur();
              }}
              style={{ borderCurve: 'continuous' }}
              className="rounded-full border border-border bg-element px-3 py-1.5">
              <Text className="text-sm text-fg">{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
