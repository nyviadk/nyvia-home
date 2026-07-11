import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

/** Flere uafhængige valg (afkrydsning). Værdien er de valgte options i skabelon-rækkefølge. */
export function ChecklistInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = new Set(value);
  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(options.filter((o) => next.has(o)));
  };

  return (
    <View className="items-start gap-2">
      {options.map((opt) => {
        const active = selected.has(opt);
        return (
          <Pressable
            key={opt}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
            onPress={() => toggle(opt)}
            style={{ borderCurve: 'continuous' }}
            className={cn(
              'flex-row items-center gap-2 rounded-full border px-3 py-2',
              active ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-element',
            )}>
            <View
              className={cn(
                'h-4 w-4 items-center justify-center rounded border',
                active ? 'border-primary bg-primary' : 'border-border',
              )}>
              {active ? <Text className="text-xs text-on-primary">✓</Text> : null}
            </View>
            <Text className={cn('text-sm', active ? 'text-fg' : 'text-fg-muted')}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
