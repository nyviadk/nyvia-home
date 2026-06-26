import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

/** Simpel segmenteret kontrol (cross-platform) til få gensidigt udelukkende valg. */
export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row rounded-xl bg-element p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            onPress={() => onChange(opt.value)}
            className={cn('flex-1 items-center rounded-lg py-2', active && 'bg-surface')}>
            <Text className={cn('text-sm', active ? 'font-semibold text-fg' : 'text-fg-muted')}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
