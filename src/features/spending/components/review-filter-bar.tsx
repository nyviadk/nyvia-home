import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

export type ReviewFilter = 'all' | 'included' | 'expense' | 'income' | 'internal' | 'duplicate';

export interface ReviewFilterOption {
  key: ReviewFilter;
  label: string;
  count: number;
}

/** Chips til at filtrere review-listen. Viser kun valg med indhold (count > 0). */
export function ReviewFilterBar({
  options,
  value,
  onChange,
}: {
  options: ReviewFilterOption[];
  value: ReviewFilter;
  onChange: (filter: ReviewFilter) => void;
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
              {o.label} {o.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
