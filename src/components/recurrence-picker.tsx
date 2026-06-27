import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import type { Cadence } from '@/lib/recurrence/types';
import type { RecurrenceForm } from '@/lib/recurrence/recurrence-form';
import { View } from '@/tw';

const CADENCE_OPTIONS = [
  { value: 'monthly' as const, label: 'Md' },
  { value: 'quarterly' as const, label: 'Kvartal' },
  { value: 'yearly' as const, label: 'År' },
  { value: 'once' as const, label: 'Engang' },
];

const DAY_KIND_OPTIONS = [
  { value: 'day' as const, label: 'Dag' },
  { value: 'firstBank' as const, label: 'Første bankdag' },
  { value: 'lastBank' as const, label: 'Sidste bankdag' },
];

/** Controlled gentagelses-vælger (genbruges af budget + abonnementer). */
export function RecurrencePicker({
  value,
  onChange,
}: {
  value: RecurrenceForm;
  onChange: (next: RecurrenceForm) => void;
}) {
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
            <FormField label="Dag i måneden (1–28)">
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

      <FormField label={value.cadence === 'once' ? 'Dato (ÅÅÅÅ-MM-DD)' : 'Start (ÅÅÅÅ-MM-DD)'}>
        <Input
          value={value.startDate}
          onChangeText={(startDate) => onChange({ ...value, startDate })}
          placeholder="2026-11-01"
        />
      </FormField>
    </View>
  );
}
