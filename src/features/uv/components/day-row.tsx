import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Text, View } from '@/tw';
import { dayLabel, formatHour, uvLevel, type UvDaySummary } from '../uv.utils';

/**
 * Én dag: label, hvornår UV ligger over 3, og dagens maks.
 * Tidspunkterne står nøgne — "over 3:" er unødigt, når man kender betydningen.
 */
export function DayRow({ day }: { day: UvDaySummary }) {
  const level = uvLevel(day.max);
  const w = day.window;

  const detail = !w
    ? 'Under 3 hele dagen'
    : day.isNow
      ? `NU — indtil ${formatHour(w.end)}`
      : day.isPast
        ? `${formatHour(w.start)}–${formatHour(w.end)} (overstået)`
        : `${formatHour(w.start)}–${formatHour(w.end)}`;

  return (
    <View
      className={cn(
        'flex-row items-center gap-2 rounded-lg px-2 py-1.5',
        // I dag fremhæves, så den ikke drukner mellem de øvrige dage.
        day.isToday && 'bg-element',
      )}
      style={{ borderCurve: 'continuous' }}>
      <AppText
        variant={day.isToday ? 'label' : 'muted'}
        numberOfLines={1}
        className="w-24 capitalize">
        {dayLabel(day.t)}
      </AppText>
      <AppText
        variant="muted"
        numberOfLines={1}
        className={cn('flex-1 text-xs', day.isNow && 'text-danger')}>
        {detail}
      </AppText>
      <Text style={{ color: level.color }} className="text-sm font-semibold">
        {day.max.toFixed(1)}
      </Text>
    </View>
  );
}
