import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

export interface FilterChip<T extends string> {
  key: T;
  label: string;
  /** Valgfrit antal vist efter etiketten. */
  count?: number;
}

/** Vandret række af filter-chips (vælg én). Genbrugelig på tværs af features. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: FilterChip<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            onPress={() => onChange(o.key)}
            className={cn(
              'rounded-full border px-3 py-1.5',
              active ? 'border-primary bg-primary' : 'border-border bg-card hover:bg-element'
            )}>
            <Text className={cn('text-sm', active ? 'text-on-primary' : 'text-fg')}>
              {o.label}
              {o.count !== undefined ? ` ${o.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
