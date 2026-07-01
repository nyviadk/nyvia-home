import { useRef, useState } from 'react';
import type {
  NativeSyntheticEvent,
  TextInput as RNTextInput,
  TextInputKeyPressEventData,
} from 'react-native';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';
import { useBudgetStore } from '../data/budget-store';
import { categorySuggestions } from '../data/categories';
import type { BudgetEntryType } from '../types';

type Option = { key: string; label: string; create?: boolean };

/**
 * Multi-kategori: valgte vises som chips (klik = fjern). Tilføj via dropdown-select med
 * fuzzy-forslag — naviger ↑/↓, vælg Enter/klik (tilføjer og bliver i feltet til flere).
 * Fri tekst tilladt via "+ Opret".
 */
export function CategoryPicker({
  type,
  value,
  onChange,
}: {
  type: BudgetEntryType;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<RNTextInput>(null);
  const entries = useBudgetStore((s) => s.entries);

  const suggestions = categorySuggestions(type, entries, query, value);
  const queryTrim = query.trim();
  const queryIsNew =
    queryTrim.length > 0 &&
    !value.some((v) => v.toLowerCase() === queryTrim.toLowerCase()) &&
    !suggestions.some((s) => s.toLowerCase() === queryTrim.toLowerCase());

  const options: Option[] = [
    ...suggestions.map((c) => ({ key: c, label: c })),
    ...(queryIsNew ? [{ key: '__create', label: `+ Opret "${queryTrim}"`, create: true }] : []),
  ];
  const visible = open && options.length > 0;

  const add = (cat: string) => {
    const c = cat.trim();
    if (!c) return;
    if (!value.some((v) => v.toLowerCase() === c.toLowerCase())) onChange([...value, c]);
    setQuery('');
    setHighlight(0);
    setOpen(false); // luk efter hvert valg (åbnes igen når man taster/fokuserer)
    inputRef.current?.blur(); // blur helt ved valg → luk tastatur + fjern fokus
  };
  const remove = (cat: string) => onChange(value.filter((v) => v !== cat));

  const commit = (i: number) => {
    const o = options[i];
    if (!o) return;
    add(o.create ? queryTrim : o.label);
  };

  function onKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const key = e.nativeEvent.key;
    if (key === 'ArrowDown') {
      e.preventDefault?.();
      if (!visible) setOpen(true);
      else setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (key === 'Enter') {
      if (visible) {
        e.preventDefault?.();
        commit(highlight);
      }
    } else if (key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <View
      className="relative gap-2"
      style={visible && process.env.EXPO_OS === 'web' ? { zIndex: 50 } : undefined}>
      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {value.map((cat) => (
            <Pressable
              key={cat}
              accessibilityRole="button"
              onPress={() => remove(cat)}
              className="flex-row items-center gap-1 rounded-full bg-primary px-3 py-1.5">
              <Text className="text-sm text-on-primary">{cat}</Text>
              <Text className="text-sm text-on-primary/80">✕</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyPress={onKeyPress}
          placeholder="Søg eller tilføj kategori (fx Mad)"
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
            {options.map((o, i) => (
              <Pressable
                key={o.key}
                accessibilityRole="button"
                onPress={() => commit(i)}
                onHoverIn={() => setHighlight(i)}
                className={cn('px-4 py-2.5', i === highlight && 'bg-element')}>
                <Text className={cn('text-base', o.create ? 'text-primary' : 'text-fg')}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
