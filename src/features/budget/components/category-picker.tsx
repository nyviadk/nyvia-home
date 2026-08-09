import { useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import {
  BLUR_CLOSE_DELAY_MS,
  DropdownList,
  useDropdownKeyboard,
} from '@/components/ui/dropdown-list';
import { Input } from '@/components/ui/input';
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
  const inputRef = useRef<RNTextInput>(null);
  const entries = useBudgetStore.useVisibleItems();

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
    // Ingen highlight-reset her: både tastning og ArrowDown nulstiller den, når listen åbnes igen.
    setOpen(false); // luk efter hvert valg (åbnes igen når man taster/fokuserer)
    inputRef.current?.blur(); // blur helt ved valg → luk tastatur + fjern fokus
  };
  const remove = (cat: string) => onChange(value.filter((v) => v !== cat));

  const commit = (o: Option) => add(o.create ? queryTrim : o.label);

  const { highlight, setHighlight, onKeyPress } = useDropdownKeyboard({
    options,
    visible,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onSelect: commit,
  });

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
          onBlur={() => setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)}
          onKeyPress={onKeyPress}
          placeholder="Søg eller tilføj kategori (fx Mad)"
          autoCapitalize="none"
        />

        {visible ? (
          <DropdownList
            options={options}
            highlight={highlight}
            onHighlight={setHighlight}
            onSelect={commit}
            labelOf={(o) => o.label}
            keyOf={(o) => o.key}
            emphasize={(o) => !!o.create}
          />
        ) : null}
      </View>
    </View>
  );
}
