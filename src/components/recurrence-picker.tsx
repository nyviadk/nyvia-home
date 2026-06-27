import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { Cadence } from '@/lib/recurrence/types';
import { normalizeDateInput, type RecurrenceForm } from '@/lib/recurrence/recurrence-form';
import { View } from '@/tw';

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

const CADENCE_OPTIONS = [
  { value: 'monthly' as const, label: 'Md' },
  { value: 'quarterly' as const, label: 'Kvartal' },
  { value: 'half_yearly' as const, label: 'Halvår' },
  { value: 'yearly' as const, label: 'År' },
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
  // Månedlige poster styres af dag-typen → start angives kun som måned (ÅÅÅÅ-MM).
  const monthOnlyStart = value.cadence === 'monthly';
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
        <View className="gap-2">
          <Segmented
            value={value.monthlyDayKind}
            options={DAY_KIND_OPTIONS}
            onChange={(monthlyDayKind) => onChange({ ...value, monthlyDayKind })}
          />
          {value.monthlyDayKind === 'day' ? (
            <FormField label="Dag i måneden (1–31)">
              <Input
                value={value.monthlyDayNumber}
                onChangeText={(monthlyDayNumber) => onChange({ ...value, monthlyDayNumber })}
                keyboardType="number-pad"
                placeholder="1"
              />
            </FormField>
          ) : null}
        </View>
      ) : null}

      {monthOnlyStart ? (
        <FormField label="Startmåned (ÅÅÅÅ-MM)" error={startError}>
          <Input value={startMonthValue} onChangeText={onStartMonth} placeholder="2026-11" autoCapitalize="none" />
        </FormField>
      ) : (
        <FormField
          label={isOnce ? 'Dato (ÅÅÅÅ-MM-DD)' : 'Start (ÅÅÅÅ-MM-DD)'}
          error={startError}>
          <Input
            value={value.startDate}
            onChangeText={(startDate) => onChange({ ...value, startDate })}
            placeholder="2026-11-01"
            autoCapitalize="none"
          />
        </FormField>
      )}

      {isOnce ? null : (
        <FormField label="Slutdato (valgfri, ÅÅÅÅ-MM)">
          <Input
            value={value.endDate ?? ''}
            onChangeText={(endDate) => onChange({ ...value, endDate: endDate.slice(0, 7) })}
            placeholder="—"
            autoCapitalize="none"
          />
        </FormField>
      )}
    </View>
  );
}
