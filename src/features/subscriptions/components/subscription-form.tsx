import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { RecurrencePicker } from '@/components/recurrence-picker';
import { cn } from '@/lib/cn';
import { Pressable, Switch, View } from '@/tw';
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
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: toSubscriptionFormValues(subscription),
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
            <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="0" />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <FormField label="Kategori">
            <View className="flex-row flex-wrap gap-2">
              {SUBSCRIPTION_CATEGORIES.map((cat) => {
                const active = cat.value === value;
                return (
                  <Pressable
                    key={cat.value}
                    accessibilityRole="button"
                    onPress={() => onChange(cat.value)}
                    className={cn('rounded-full px-3 py-1.5', active ? 'bg-primary' : 'bg-element')}>
                    <AppText className={cn('text-sm', active ? 'text-on-primary' : 'text-fg')}>
                      {cat.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
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
            <Input value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="" />
          </FormField>
        )}
      />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
