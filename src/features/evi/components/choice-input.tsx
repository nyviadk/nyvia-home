import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

/** Præcis ét valg (kan fravælges igen → tomt, da alt er valgfrit). */
export function ChoiceInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View className="items-start gap-2">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(active ? '' : opt)}
            style={{ borderCurve: 'continuous' }}
            className={cn(
              'rounded-full border px-3.5 py-2',
              active ? 'border-primary bg-primary' : 'border-border bg-card hover:bg-element',
            )}>
            <Text className={cn('text-sm', active ? 'font-medium text-on-primary' : 'text-fg')}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
