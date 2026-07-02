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
    <View className="flex-row rounded-xl bg-element p-1" style={{ borderCurve: 'continuous' }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            onPress={() => onChange(opt.value)}
            style={
              active
                ? { borderCurve: 'continuous', boxShadow: '0 1px 2px rgba(40, 40, 38, 0.08)' }
                : undefined
            }
            className={cn(
              'flex-1 items-center rounded-lg py-2 will-change-pressable',
              active ? 'bg-card' : 'hover:bg-card/60 active:bg-card'
            )}>
            <Text className={cn('text-sm', active ? 'font-semibold text-fg' : 'text-fg-muted')}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
