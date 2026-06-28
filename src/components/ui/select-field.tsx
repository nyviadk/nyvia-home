import { useState } from 'react';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Dropdown-select over en fast liste (samme UX som timetracker-felterne): skriv for at
 * filtrere, naviger ↑/↓, vælg Enter/klik. Ingen chips, ingen fri tekst.
 */
export function SelectField<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  invalid,
  onSelectAdvance,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (next: T) => void;
  placeholder?: string;
  invalid?: boolean;
  onSelectAdvance?: () => void;
}) {
  // query=null → ikke i redigering (vis valgt label); ellers vis/filtrér på query.
  const [query, setQuery] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  const selected = options.find((o) => o.value === value);
  const editing = query !== null;
  const text = editing ? query : (selected?.label ?? '');
  const filtered =
    editing && query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;
  const visible = editing && filtered.length > 0;

  const commit = (i: number) => {
    const o = filtered[i];
    if (!o) return;
    onChange(o.value);
    setQuery(null);
    onSelectAdvance?.();
  };

  function onKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const key = e.nativeEvent.key;
    if (key === 'ArrowDown') {
      e.preventDefault?.();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (key === 'Enter') {
      if (visible) {
        e.preventDefault?.();
        commit(highlight);
      }
    } else if (key === 'Escape') {
      setQuery(null);
    }
  }

  return (
    <View className="relative" style={visible ? { zIndex: 50 } : undefined}>
      <Input
        value={text}
        invalid={invalid}
        placeholder={placeholder}
        onChangeText={(t) => {
          setQuery(t);
          setHighlight(0);
        }}
        onFocus={() => {
          setQuery('');
          setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
        }}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        onKeyPress={onKeyPress}
        autoCapitalize="none"
      />

      {visible ? (
        <View
          className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-xl border border-border bg-card"
          style={{
            boxShadow: '0 6px 16px rgba(40, 40, 38, 0.12)',
            borderCurve: 'continuous',
            elevation: 8,
          }}>
          {filtered.map((o, i) => (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              onPress={() => commit(i)}
              onHoverIn={() => setHighlight(i)}
              className={cn('px-4 py-2.5', i === highlight && 'bg-element')}>
              <Text className={cn('text-base', o.value === value ? 'text-primary' : 'text-fg')}>
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
