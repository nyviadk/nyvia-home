import { useState } from 'react';
import { Modal } from 'react-native';
import { DateTime } from 'luxon';

import { AppText } from '@/components/ui/text';
import { APP_TIMEZONE, formatDateCopenhagen, formatMonthCopenhagen, todayISODate } from '@/lib/datetime';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

const WEEKDAYS = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

export interface DateFieldProps {
  /** ÅÅÅÅ-MM-DD (mode 'day') eller ÅÅÅÅ-MM (mode 'month'). */
  value: string;
  onChange: (next: string) => void;
  mode?: 'day' | 'month';
  /** Nedre/øvre grænse (samme format som value). Dage udenfor er deaktiverede. */
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  invalid?: boolean;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Dato-felt der åbner en kalender (i dag markeret) i stedet for fri-tekst. */
export function DateField({
  value,
  onChange,
  mode = 'day',
  minDate,
  maxDate,
  placeholder = 'Vælg dato',
  invalid,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const today = DateTime.now().setZone(APP_TIMEZONE).startOf('day');

  const valueDt = value
    ? DateTime.fromISO(mode === 'month' ? `${value}-01` : value, { zone: APP_TIMEZONE })
    : null;
  const [view, setView] = useState<DateTime>(() => (valueDt ?? today).startOf('month'));

  const display = value
    ? mode === 'month'
      ? capitalize(formatMonthCopenhagen(`${value}-01`))
      : formatDateCopenhagen(value)
    : placeholder;

  const close = () => setOpen(false);
  const openPicker = () => {
    setView((valueDt ?? today).startOf('month'));
    setOpen(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        style={{ borderCurve: 'continuous' }}
        className={cn(
          'h-12 flex-row items-center rounded-xl border bg-card px-4',
          invalid ? 'border-danger' : 'border-border'
        )}>
        <Text className={cn('text-base', value ? 'text-fg' : 'text-fg-muted')}>{display}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          onPress={close}
          style={{ backgroundColor: 'rgba(40, 40, 38, 0.35)' }}
          className="flex-1 items-center justify-center p-6">
          <Pressable
            onPress={() => {}}
            style={{ boxShadow: '0 8px 24px rgba(40, 40, 38, 0.18)', borderCurve: 'continuous' }}
            className="w-full max-w-80 gap-3 rounded-2xl border border-border bg-card p-4">
            {mode === 'month' ? (
              <MonthGrid
                view={view}
                setView={setView}
                value={value}
                today={today}
                minDate={minDate}
                maxDate={maxDate}
                onSelect={(v) => {
                  onChange(v);
                  close();
                }}
              />
            ) : (
              <DayGrid
                view={view}
                setView={setView}
                value={value}
                minDate={minDate}
                maxDate={maxDate}
                onSelect={(v) => {
                  onChange(v);
                  close();
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Header({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable accessibilityRole="button" onPress={onPrev} hitSlop={8} className="px-2 py-1">
        <AppText variant="heading">‹</AppText>
      </Pressable>
      <AppText variant="label" className="capitalize">
        {label}
      </AppText>
      <Pressable accessibilityRole="button" onPress={onNext} hitSlop={8} className="px-2 py-1">
        <AppText variant="heading">›</AppText>
      </Pressable>
    </View>
  );
}

function DayGrid({
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
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DateTime | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayStr = todayISODate();

  return (
    <View className="gap-2">
      <Header
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
        <View key={wi} className="flex-row">
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

function MonthGrid({
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
      <Header
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
            const disabled =
              (minDate && ms < minDate.slice(0, 7)) || (maxDate && ms > maxDate.slice(0, 7));
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
