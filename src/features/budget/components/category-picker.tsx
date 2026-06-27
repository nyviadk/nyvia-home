import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';
import { useBudgetStore } from '../data/budget-store';
import { categorySuggestions } from '../data/categories';
import type { BudgetEntryType } from '../types';

/**
 * Multi-kategori-vælger: valgte kategorier som chips (klik = fjern) + søgefelt med
 * fuzzy-forslag (klik = tilføj). Fri tekst tillades (Enter eller "+"-chip).
 * `query` er ren UI-state (ephemeral søgetekst) — derfor useState.
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
  const entries = useBudgetStore((s) => s.entries);
  const suggestions = categorySuggestions(type, entries, query, value);

  const add = (cat: string) => {
    const c = cat.trim();
    if (!c) return;
    if (!value.some((v) => v.toLowerCase() === c.toLowerCase())) onChange([...value, c]);
    setQuery('');
  };
  const remove = (cat: string) => onChange(value.filter((v) => v !== cat));

  const queryIsNew =
    query.trim().length > 0 &&
    !value.some((v) => v.toLowerCase() === query.trim().toLowerCase()) &&
    !suggestions.some((s) => s.toLowerCase() === query.trim().toLowerCase());

  return (
    <View className="gap-2">
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

      <Input
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => add(query)}
        returnKeyType="done"
        placeholder="Søg eller tilføj kategori (fx Mad)"
        autoCapitalize="none"
      />

      {suggestions.length > 0 || queryIsNew ? (
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((cat) => (
            <Pressable
              key={cat}
              accessibilityRole="button"
              onPress={() => add(cat)}
              className="rounded-full bg-element px-3 py-1.5">
              <Text className="text-sm text-fg">{cat}</Text>
            </Pressable>
          ))}
          {queryIsNew ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => add(query)}
              className={cn('rounded-full border border-border px-3 py-1.5')}>
              <Text className="text-sm text-primary">+ "{query.trim()}"</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
