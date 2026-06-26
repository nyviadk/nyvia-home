import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { todayISODate } from '@/lib/datetime';
import { parseKronerInput } from '@/lib/money';
import { View } from '@/tw';
import { type PaymentFormValues, paymentFormSchema } from '../data/loans.schema';

export interface PaymentInput {
  amount: number;
  date: string;
  note?: string;
}

export function PaymentForm({ onSubmit }: { onSubmit: (input: PaymentInput) => Promise<void> }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: '', date: todayISODate(), note: '' },
  });

  const submit = handleSubmit(async (values) => {
    const note = values.note?.trim();
    await onSubmit({
      amount: parseKronerInput(values.amount) ?? 0,
      date: values.date,
      note: note ? note : undefined,
    });
    reset({ amount: '', date: todayISODate(), note: '' });
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Beløb (kr.)" error={errors.amount?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.amount}
              keyboardType="decimal-pad"
              placeholder="1200"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Dato (ÅÅÅÅ-MM-DD)" error={errors.date?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.date}
              placeholder="2026-06-26"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Note (valgfri)" error={errors.note?.message}>
            <Input
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Fx ekstra afdrag"
            />
          </FormField>
        )}
      />

      <Button title="Registrér afdrag" onPress={submit} loading={isSubmitting} />
    </View>
  );
}
