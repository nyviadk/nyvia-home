import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { SelectField } from '@/components/ui/select-field';
import { AppText } from '@/components/ui/text';
import { RecurrencePicker } from '@/components/recurrence-picker';
import { useBudgetSettingsStore } from '@/features/budget/data/budget-settings-store';
import { Switch, View } from '@/tw';
import {
  type SubscriptionFormValues,
  subscriptionFormSchema,
  toSubscriptionFormValues,
  toSubscriptionInput,
} from '../data/subscription.schema';
import { SUBSCRIPTION_CATEGORIES, type Subscription, type SubscriptionInput } from '../types';

export interface SubscriptionFormProps {
  subscription?: Subscription;
  submitLabel: string;
  onSubmit: (input: SubscriptionInput) => Promise<void>;
}

export function SubscriptionForm({ subscription, submitLabel, onSubmit }: SubscriptionFormProps) {
  const budgetStart = useBudgetSettingsStore((s) => s.startDate);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: toSubscriptionFormValues(subscription, budgetStart),
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(toSubscriptionInput(values));
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Navn" error={errors.name?.message}>
            <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Fx Netflix" />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Beløb / gang (kr.)" error={errors.amount?.message}>
            <MoneyInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="0" />
          </FormField>
        )}
      />

      {/* zIndex så kategori-dropdown'en lægger sig over felterne nedenunder. */}
      <View style={{ zIndex: 5 }}>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <FormField label="Kategori">
              <SelectField
                value={value}
                options={SUBSCRIPTION_CATEGORIES}
                onChange={onChange}
                placeholder="Vælg kategori"
              />
            </FormField>
          )}
        />
      </View>

      <Controller
        control={control}
        name="recurrence"
        render={({ field: { onChange, value } }) => (
          <RecurrencePicker value={value} onChange={onChange} minDate={budgetStart ?? undefined} />
        )}
      />

      <View className="flex-row items-center justify-between">
        <AppText variant="label">Aktiv (medregnes i budget)</AppText>
        <Controller
          control={control}
          name="active"
          render={({ field: { onChange, value } }) => (
            <Switch value={value} onValueChange={onChange} />
          )}
        />
      </View>

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Note (valgfri)">
            <Input
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Fx vilkår, kontekst…"
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
