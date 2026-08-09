import { useState } from 'react';
import { DateTime } from 'luxon';

import { ModalSheet } from '@/components/ui/modal-sheet';
import { cn } from '@/lib/cn';
import { APP_TIMEZONE, formatDateCopenhagen, formatMonthCopenhagen } from '@/lib/datetime';
import { Pressable, Text } from '@/tw';
import { DayGrid } from './date-field/day-grid';
import { MonthGrid } from './date-field/month-grid';

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
      ? formatMonthCopenhagen(`${value}-01`)
      : formatDateCopenhagen(value)
    : placeholder;

  const close = () => setOpen(false);
  const select = (v: string) => {
    onChange(v);
    close();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          // Åbn altid på den valgte måned (eller denne måned), ikke der hvor man sidst bladrede.
          setView((valueDt ?? today).startOf('month'));
          setOpen(true);
        }}
        style={{ borderCurve: 'continuous' }}
        className={cn(
          'h-12 flex-row items-center rounded-xl border bg-card px-4',
          invalid ? 'border-danger' : 'border-border'
        )}>
        <Text className={cn('text-base', value ? 'text-fg' : 'text-fg-muted')}>{display}</Text>
      </Pressable>

      <ModalSheet visible={open} onClose={close} className="max-w-80">
        {mode === 'month' ? (
          <MonthGrid
            view={view}
            setView={setView}
            value={value}
            today={today}
            minDate={minDate}
            maxDate={maxDate}
            onSelect={select}
          />
        ) : (
          <DayGrid
            view={view}
            setView={setView}
            value={value}
            minDate={minDate}
            maxDate={maxDate}
            onSelect={select}
          />
        )}
      </ModalSheet>
    </>
  );
}
