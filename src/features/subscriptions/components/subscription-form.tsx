import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { FormField } from '@/components/ui/form-field';
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
      <ControlledField control={control} name="name" label="Navn"
        error={errors.name?.message} placeholder="Fx Netflix" />

      <ControlledField control={control} name="amount" money label="Beløb / gang (kr.)"
        error={errors.amount?.message} placeholder="0" />

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
            <ControlledField control={control} name="introAmount" money
              label="Introbeløb (samlet, kr.)" error={errors.introAmount?.message}
              placeholder="fx 534,82" />
            <ControlledField control={control} name="introMonths"
              label="Dækker antal måneder" error={errors.introMonths?.message}
              placeholder="fx 24" keyboardType="number-pad" />
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

      <ControlledField control={control} name="note" label="Note (valgfri)" multiline
        placeholder="Fx vilkår, kontekst…" />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
