import { useState } from 'react';
import type {
  NativeSyntheticEvent,
  TextInput as RNTextInput,
  TextInputKeyPressEventData,
} from 'react-native';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';
import { maskTimeInput, timeSuggestions } from '../time.utils';

/**
 * Tidsfelt med auto-kolon (du skriver kun cifre) + en dropdown-select med søge-agtige
 * forslag. Naviger med ↑/↓, vælg med Enter/klik — ved valg hopper fokus videre via
 * `onSelectAdvance`. Ingen chips.
 */
export function TimeInput({
  value,
  onChange,
  onBlur,
  placeholder,
  inputRef,
  onSelectAdvance,
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  inputRef?: React.Ref<RNTextInput>;
  onSelectAdvance?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = timeSuggestions(value).filter((s) => s !== value);
  const visible = open && suggestions.length > 0;

  function commit(s: string) {
    onChange(s);
    setOpen(false);
    onSelectAdvance?.();
  }

  function onKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const key = e.nativeEvent.key;
    if (key === 'ArrowDown') {
      e.preventDefault?.();
      if (!visible) {
        setOpen(true);
        setHighlight(0);
      } else {
        setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (key === 'Enter') {
      if (visible) {
        e.preventDefault?.();
        commit(suggestions[highlight] ?? suggestions[0]);
      }
    } else if (key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    // Løft hele feltet mens dropdown er åben, så den lægger sig OVER de følgende felter
    // (zIndex alene på den absolutte liste er ikke nok — senere søskende tegnes ovenpå).
    <View className="relative" style={visible && process.env.EXPO_OS === 'web' ? { zIndex: 50 } : undefined}>
      <Input
        ref={inputRef}
        value={value}
        onChangeText={(t) => {
          onChange(maskTimeInput(t));
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Lille forsinkelse så klik på et forslag når at registrere før lukning.
          setTimeout(() => setOpen(false), 120);
          onBlur?.();
        }}
        onKeyPress={onKeyPress}
        keyboardType="numbers-and-punctuation"
        placeholder={placeholder}
      />

      {visible ? (
        <View
          className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-xl border border-border bg-card"
          style={{
            boxShadow: '0 6px 16px rgba(40, 40, 38, 0.12)',
            borderCurve: 'continuous',
            elevation: 8,
          }}>
          {suggestions.map((s, i) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => commit(s)}
              onHoverIn={() => setHighlight(i)}
              className={cn('px-4 py-2.5', i === highlight && 'bg-element')}>
              <Text className="text-base text-fg">{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
