import { useState } from 'react';
import type {
  NativeSyntheticEvent,
  TextInput as RNTextInput,
  TextInputKeyPressEventData,
} from 'react-native';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';
import { categorySuggestions } from '../data/categories';
import { useTimetrackerStore } from '../data/timetracker-store';

/**
 * Funktion/kategori-felt som dropdown-select: fri tekst (feltet ér værdien) + søge-agtige
 * forslag. Naviger med ↑/↓, vælg med Enter/klik — ved valg hopper fokus videre via
 * `onSelectAdvance`. Ingen chips.
 */
export function CategoryPicker({
  value,
  onChange,
  inputRef,
  onSelectAdvance,
}: {
  value: string;
  onChange: (next: string) => void;
  inputRef?: React.Ref<RNTextInput>;
  onSelectAdvance?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const entries = useTimetrackerStore((s) => s.entries);
  const suggestions = categorySuggestions(entries, value);
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
    <View className="relative" style={visible ? { zIndex: 50 } : undefined}>
      <Input
        ref={inputRef}
        value={value}
        onChangeText={(t) => {
          onChange(t);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyPress={onKeyPress}
        placeholder="Funktion (fx Udvikling)"
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
