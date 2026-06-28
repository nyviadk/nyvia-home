import { DateField } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { Cadence } from '@/lib/recurrence/types';
import { normalizeDateInput, type RecurrenceForm } from '@/lib/recurrence/recurrence-form';
import { Pressable, View } from '@/tw';

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

const CADENCE_OPTIONS = [
  { value: 'monthly' as const, label: 'Md' },
  { value: 'quarterly' as const, label: 'Kvartal' },
  { value: 'half_yearly' as const, label: 'Halvår' },
  { value: 'yearly' as const, label: 'År' },
  { value: 'biennial' as const, label: '2 år' },
  { value: 'triennial' as const, label: '3 år' },
  { value: 'once' as const, label: 'Engang' },
];

const DAY_KIND_OPTIONS = [
  { value: 'day' as const, label: 'Dag' },
  { value: 'firstBank' as const, label: 'Første bankdag' },
  { value: 'lastBank' as const, label: 'Sidste bankdag' },
  { value: 'month' as const, label: 'Kun måned' },
];

/** Controlled gentagelses-vælger (genbruges af budget + abonnementer). */
export function RecurrencePicker({
  value,
  onChange,
  minDate,
}: {
  value: RecurrenceForm;
  onChange: (next: RecurrenceForm) => void;
  /** Nedre grænse (ÅÅÅÅ-MM-DD) for startdatoen, fx budgettets startdato. */
  minDate?: string;
}) {
  // Bestemt dag (eller ikke-månedlig) → vælg fuld startdato; bankdag/kun-måned → kun måned.
  const useDayStart = value.cadence !== 'monthly' || value.monthlyDayKind === 'day';
  const isOnce = value.cadence === 'once';

  const normStart = ISO_DATE.test(value.startDate) ? normalizeDateInput(value.startDate) : value.startDate;
  const startError =
    minDate && ISO_DATE.test(value.startDate) && normStart < minDate
      ? `Kan ikke være før budgettets start (${formatDateCopenhagen(minDate)})`
      : undefined;

  // Ved måned-input redigeres kun ÅÅÅÅ-MM (dag = 01 internt).
  const onStartMonth = (text: string) => onChange({ ...value, startDate: text.slice(0, 7) });
  const startMonthValue = value.startDate.length >= 7 ? value.startDate.slice(0, 7) : value.startDate;

  return (
    <View className="gap-3">
      <FormField label="Gentagelse">
        <Segmented<Cadence>
          value={value.cadence}
          options={CADENCE_OPTIONS}
          onChange={(cadence) => onChange({ ...value, cadence })}
        />
      </FormField>

      {value.cadence === 'monthly' ? (
        <FormField label="Hvornår på måneden">
          <Segmented
            value={value.monthlyDayKind}
            options={DAY_KIND_OPTIONS}
            onChange={(monthlyDayKind) => onChange({ ...value, monthlyDayKind })}
          />
        </FormField>
      ) : null}

      {/* Bestemt dag (månedlig) eller kvartal/halvår/år/engang → vælg en rigtig startdato
          (dagen gentages hver periode). Bankdag/kun-måned → kun måned. */}
      {useDayStart ? (
        <FormField label={isOnce ? 'Dato' : 'Startdato'} error={startError}>
          <DateField
            value={value.startDate}
            onChange={(startDate) => onChange({ ...value, startDate })}
            minDate={minDate}
            invalid={!!startError}
          />
        </FormField>
      ) : (
        <FormField label="Startmåned" error={startError}>
          <DateField
            mode="month"
            value={startMonthValue}
            onChange={onStartMonth}
            minDate={minDate}
            invalid={!!startError}
          />
        </FormField>
      )}

      {isOnce ? null : (
        <FormField label="Slutdato (valgfri)">
          <View className="gap-2">
            <DateField
              value={normalizeDateInput(value.endDate ?? '') || ''}
              onChange={(endDate) => onChange({ ...value, endDate })}
              minDate={normalizeDateInput(value.startDate)}
              placeholder="Ingen slutdato"
            />
            {value.endDate ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onChange({ ...value, endDate: '' })}>
                <AppText className="text-sm text-danger">Fjern slutdato</AppText>
              </Pressable>
            ) : null}
          </View>
        </FormField>
      )}
    </View>
  );
}
