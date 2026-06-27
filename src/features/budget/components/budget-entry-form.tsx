import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { RecurrencePicker } from '@/components/recurrence-picker';
import { View } from '@/tw';
import { type BudgetFormValues, budgetFormSchema, toBudgetFormValues, toBudgetInput } from '../data/budget.schema';
import type { BudgetEntry, BudgetEntryInput, BudgetEntryType } from '../types';
import { CategoryPicker } from './category-picker';

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
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: toBudgetFormValues(entry),
  });

  const type = useWatch({ control, name: 'type' }) as BudgetEntryType;

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

      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <FormField label="Kategori" error={errors.category?.message}>
            <CategoryPicker type={type} value={value} onChange={onChange} />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="recurrence"
        render={({ field: { onChange, value } }) => (
          <RecurrencePicker value={value} onChange={onChange} />
        )}
      />

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Note (valgfri)">
            <Input value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="" />
          </FormField>
        )}
      />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
