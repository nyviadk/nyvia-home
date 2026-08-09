import { DateTime } from 'luxon';

import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { todayISODate } from '@/lib/datetime';
import { Pressable, Text, View } from '@/tw';
import { CalendarHeader } from './calendar-header';

const WEEKDAYS = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

export function DayGrid({
  view,
  setView,
  value,
  minDate,
  maxDate,
  onSelect,
}: {
  view: DateTime;
  setView: (d: DateTime) => void;
  value: string;
  minDate?: string;
  maxDate?: string;
  onSelect: (v: string) => void;
}) {
  const monthStart = view.startOf('month');
  const offset = monthStart.weekday - 1; // Mandag-først
  const daysInMonth = monthStart.daysInMonth ?? 30;
  const cells: (DateTime | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(monthStart.set({ day: d }));
  // Fyld altid op til 6 uger (42 celler), så kalenderen har fast højde og pilene ikke
  // flytter sig når man bladrer mellem måneder med forskelligt antal uge-rækker.
  while (cells.length < 42) cells.push(null);
  const weeks: (DateTime | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayStr = todayISODate();

  return (
    <View className="gap-2">
      <CalendarHeader
        label={monthStart.setLocale('da').toFormat('LLLL yyyy')}
        onPrev={() => setView(monthStart.minus({ months: 1 }))}
        onNext={() => setView(monthStart.plus({ months: 1 }))}
      />
      <View className="flex-row">
        {WEEKDAYS.map((w) => (
          <View key={w} className="flex-1 items-center">
            <AppText variant="muted" className="text-xs">
              {w}
            </AppText>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} className="h-10 flex-row items-center">
          {week.map((cell, ci) => {
            if (!cell) return <View key={ci} className="flex-1" />;
            const ds = cell.toFormat('yyyy-MM-dd');
            const selected = ds === value;
            const isToday = ds === todayStr;
            const disabled = (minDate && ds < minDate) || (maxDate && ds > maxDate);
            return (
              <View key={ci} className="flex-1 items-center py-0.5">
                <Pressable
                  accessibilityRole="button"
                  disabled={!!disabled}
                  onPress={() => onSelect(ds)}
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-full',
                    selected && 'bg-primary',
                    !selected && isToday && 'border border-primary',
                    disabled && 'opacity-30'
                  )}>
                  <Text className={cn('text-sm', selected ? 'text-on-primary' : 'text-fg')}>
                    {cell.day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
