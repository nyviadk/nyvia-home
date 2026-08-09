import { DateTime } from 'luxon';

import { cn } from '@/lib/cn';
import { APP_TIMEZONE, ym } from '@/lib/datetime';
import { Pressable, Text, View } from '@/tw';
import { CalendarHeader } from './calendar-header';

export function MonthGrid({
  view,
  setView,
  value,
  today,
  minDate,
  maxDate,
  onSelect,
}: {
  view: DateTime;
  setView: (d: DateTime) => void;
  value: string;
  today: DateTime;
  minDate?: string;
  maxDate?: string;
  onSelect: (v: string) => void;
}) {
  const year = view.year;
  const todayMonth = today.toFormat('yyyy-MM');
  const months = Array.from({ length: 12 }, (_, i) =>
    DateTime.fromObject({ year, month: i + 1 }, { zone: APP_TIMEZONE })
  );
  const rows: DateTime[][] = [];
  for (let i = 0; i < months.length; i += 3) rows.push(months.slice(i, i + 3));

  return (
    <View className="gap-2">
      <CalendarHeader
        label={String(year)}
        onPrev={() => setView(view.minus({ years: 1 }))}
        onNext={() => setView(view.plus({ years: 1 }))}
      />
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row gap-2">
          {row.map((m) => {
            const ms = m.toFormat('yyyy-MM');
            const selected = ms === value;
            const isCurrent = ms === todayMonth;
            const disabled = (minDate && ms < ym(minDate)) || (maxDate && ms > ym(maxDate));
            return (
              <Pressable
                key={ms}
                accessibilityRole="button"
                disabled={!!disabled}
                onPress={() => onSelect(ms)}
                className={cn(
                  'flex-1 items-center rounded-xl py-2',
                  selected ? 'bg-primary' : 'bg-element',
                  !selected && isCurrent && 'border border-primary',
                  disabled && 'opacity-30'
                )}>
                <Text className={cn('text-sm capitalize', selected ? 'text-on-primary' : 'text-fg')}>
                  {m.setLocale('da').toFormat('LLL')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
