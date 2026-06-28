import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

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

  const introEnabled = useWatch({ control, name: 'introEnabled' });

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

      <View className="gap-3 rounded-2xl border border-border p-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <AppText variant="label">Introtilbud (nykunde)</AppText>
            <AppText variant="muted">
              Én stor betaling i startmåneden; normalprisen ovenfor tæller først efter
              intro-perioden.
            </AppText>
          </View>
          <Controller
            control={control}
            name="introEnabled"
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>

        {introEnabled ? (
          <>
            <Controller
              control={control}
              name="introAmount"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField label="Introbeløb (samlet, kr.)" error={errors.introAmount?.message}>
                  <MoneyInput
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="fx 534,82"
                  />
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="introMonths"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField label="Dækker antal måneder" error={errors.introMonths?.message}>
                  <Input
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="fx 24"
                    keyboardType="number-pad"
                  />
                </FormField>
              )}
            />
          </>
        ) : null}
      </View>

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
