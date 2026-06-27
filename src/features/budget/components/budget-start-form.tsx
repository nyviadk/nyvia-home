import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { View } from '@/tw';

const schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Brug formatet ÅÅÅÅ-MM-DD'),
});

type Values = z.infer<typeof schema>;

export function BudgetStartForm({
  startDate,
  onSubmit,
}: {
  startDate: string;
  onSubmit: (startDate: string) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { startDate } });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values.startDate);
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="startDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Budgettets startdato (ÅÅÅÅ-MM-DD)" error={errors.startDate?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="2026-01-01"
              autoCapitalize="none"
            />
          </FormField>
        )}
      />
      <Button title="Gem" onPress={submit} loading={isSubmitting} />
    </View>
  );
}
