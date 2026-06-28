import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AppText } from "@/components/ui/text";
import { View } from "@/tw";

const schema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Brug formatet ÅÅÅÅ-MM-DD"),
  savingsPercent: z.string().refine((s) => {
    if (s.trim() === "") return true; // tomt = ingen opsparing (0)
    const n = Number.parseFloat(s.replace(",", ".").trim());
    return Number.isFinite(n) && n >= 0 && n <= 100;
  }, "0–100"),
});

type Values = z.infer<typeof schema>;

export function BudgetStartForm({
  startDate,
  savingsPercent,
  onSubmit,
}: {
  startDate: string;
  savingsPercent: number;
  onSubmit: (values: {
    startDate: string;
    savingsPercent: number;
  }) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate,
      savingsPercent: savingsPercent ? String(savingsPercent) : "",
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      startDate: values.startDate,
      savingsPercent:
        Number.parseFloat(values.savingsPercent.replace(",", ".")) || 0,
    });
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="startDate"
        render={({ field: { onChange, value } }) => (
          <FormField label="Budgettets startdato" error={errors.startDate?.message}>
            <DateField value={value} onChange={onChange} invalid={!!errors.startDate} />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="savingsPercent"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Automatisk opsparing (%)"
            error={errors.savingsPercent?.message}
          >
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <AppText variant="muted">
              Trækkes automatisk som opsparing af månedens rådighedsbeløb. Lad
              feltet stå tomt for ingen opsparing.
            </AppText>
          </FormField>
        )}
      />
      <Button title="Gem" onPress={submit} loading={isSubmitting} />
    </View>
  );
}
