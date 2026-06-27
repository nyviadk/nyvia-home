import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { RecurrencePicker } from '@/components/recurrence-picker';
import { Switch, View } from '@/tw';
import { type BudgetFormValues, budgetFormSchema, toBudgetFormValues, toBudgetInput } from '../data/budget.schema';
import { useBudgetSettingsStore } from '../data/budget-settings-store';
import { effectiveStartMin } from '../data/budget-start';
import type { BudgetEntry, BudgetEntryInput, BudgetEntryType } from '../types';
import { CategoryPicker } from './category-picker';
import { SalaryAmountField } from './salary-amount-field';

const TYPE_OPTIONS = [
  { value: 'expense' as const, label: 'Udgift' },
  { value: 'income' as const, label: 'Indtægt' },
];

export interface BudgetEntryFormProps {
  entry?: BudgetEntry;
  submitLabel: string;
  onSubmit: (input: BudgetEntryInput) => Promise<void>;
}

export function BudgetEntryForm({ entry, submitLabel, onSubmit }: BudgetEntryFormProps) {
  const budgetStart = useBudgetSettingsStore((s) => s.startDate);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: toBudgetFormValues(entry, budgetStart),
  });

  const type = useWatch({ control, name: 'type' }) as BudgetEntryType;
  const advanceMonth = useWatch({ control, name: 'advanceMonth' });
  const minDate = effectiveStartMin(budgetStart, type === 'income' && advanceMonth) ?? undefined;

  const submit = handleSubmit(async (values) => {
    await onSubmit(toBudgetInput(values));
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <FormField label="Type">
            <Segmented value={value} options={TYPE_OPTIONS} onChange={onChange} />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Navn" error={errors.name?.message}>
            <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Fx Primær løn" />
          </FormField>
        )}
      />

      {type === 'income' ? (
        <SalaryAmountField control={control} errors={errors} />
      ) : (
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Beløb / gang (kr.)" error={errors.amount?.message}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </FormField>
          )}
        />
      )}

      <Controller
        control={control}
        name="categories"
        render={({ field: { onChange, value } }) => (
          <FormField label="Kategorier" error={errors.categories?.message}>
            <CategoryPicker type={type} value={value} onChange={onChange} />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="recurrence"
        render={({ field: { onChange, value } }) => (
          <RecurrencePicker value={value} onChange={onChange} minDate={minDate} />
        )}
      />

      {type === 'income' ? (
        <Controller
          control={control}
          name="advanceMonth"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <AppText variant="label">Udbetales måneden før (forudløn)</AppText>
                <AppText variant="muted">
                  Fx løn udbetalt sidste bankdag i sep. tæller i oktobers rådighedsbeløb.
                </AppText>
              </View>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Note (valgfri)">
            <Input
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Fx reel forbrug, vilkår, kontekst…"
              multiline
              className="h-auto min-h-24 py-3"
              textAlignVertical="top"
            />
          </FormField>
        )}
      />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
