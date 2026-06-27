import { Input } from '@/components/ui/input';
import { Pressable, Text, View } from '@/tw';
import { useBudgetStore } from '../data/budget-store';
import { categorySuggestions } from '../data/categories';
import type { BudgetEntryType } from '../types';

/** Kategori-felt med søgbare forslag (presets ∪ brugte). Fri tekst tilladt. */
export function CategoryPicker({
  type,
  value,
  onChange,
}: {
  type: BudgetEntryType;
  value: string;
  onChange: (next: string) => void;
}) {
  const entries = useBudgetStore((s) => s.entries);
  const suggestions = categorySuggestions(type, entries, value);

  return (
    <View className="gap-2">
      <Input value={value} onChangeText={onChange} placeholder="Kategori (fx Husleje)" />
      {suggestions.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((cat) => (
            <Pressable
              key={cat}
              accessibilityRole="button"
              onPress={() => onChange(cat)}
              className="rounded-full bg-element px-3 py-1.5">
              <Text className="text-sm text-fg">{cat}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
