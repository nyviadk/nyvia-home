import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { TextInput as RNTextInput } from 'react-native';

import { cn } from '@/lib/cn';
import { Pressable, Text } from '@/tw';

const pad = (n: number) => String(n).padStart(2, '0');

/** "HH:mm" → Date (i dag). Tom/ugyldig → 09:00. */
function toDate(value: string): Date {
  const [h, m] = value.split(':').map((n) => Number.parseInt(n, 10));
  const date = new Date();
  date.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return date;
}

/**
 * Android: tidsfelt der åbner systemets ur-picker (24-timers klok, ikke iOS-scroll).
 * Web/iOS bruger tekst-feltet med forslag (time-input.tsx). Samme brugs-API som den
 * fælles TimeInput (onBlur/inputRef/onSelectAdvance er irrelevante for en picker og ignoreres).
 */
export function TimeInput({
  value,
  onChange,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  inputRef?: React.Ref<RNTextInput>;
  invalid?: boolean;
  onSelectAdvance?: () => void;
}) {
  const openPicker = () =>
    DateTimePickerAndroid.open({
      value: toDate(value),
      mode: 'time',
      is24Hour: true,
      display: 'clock',
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
      },
    });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openPicker}
      style={{ borderCurve: 'continuous' }}
      className={cn(
        'h-12 flex-row items-center rounded-xl border bg-card px-4',
        invalid ? 'border-danger' : 'border-border',
      )}>
      <Text className={cn('text-base', value ? 'text-fg' : 'text-fg-muted')}>
        {value || placeholder || 'Vælg tid'}
      </Text>
    </Pressable>
  );
}
