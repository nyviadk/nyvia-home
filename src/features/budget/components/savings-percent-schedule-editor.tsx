import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AppText } from "@/components/ui/text";
import { formatMonthCopenhagen } from "@/lib/datetime";
import { Pressable, View } from "@/tw";
import type { SavingsPercentChange } from "../types";

const schema = z.object({
  fromYm: z.string().regex(/^\d{4}-\d{2}$/, "Brug ÅÅÅÅ-MM"),
  percent: z.string().refine((s) => {
    const n = Number.parseFloat(s.replace(",", ".").trim());
    return Number.isFinite(n) && n >= 0 && n <= 100;
  }, "0–100"),
});
type Values = z.infer<typeof schema>;

const sortChanges = (changes: SavingsPercentChange[]) =>
  [...changes].sort((a, b) => a.fromYm.localeCompare(b.fromYm));

/**
 * Fremadrettede ændringer af opsparingsprocenten (fx start 20%, hæv til 30% fra en
 * måned). Påvirker ikke fortiden — forecasten bruger seneste ændring <= måneden.
 */
export function SavingsPercentScheduleEditor({
  changes,
  onSave,
}: {
  changes: SavingsPercentChange[];
  onSave: (changes: SavingsPercentChange[]) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fromYm: "", percent: "" },
  });

  const add = handleSubmit(async (values) => {
    const next = sortChanges([
      ...changes.filter((c) => c.fromYm !== values.fromYm),
      {
        fromYm: values.fromYm,
        percent: Number.parseFloat(values.percent.replace(",", ".")) || 0,
      },
    ]);
    await onSave(next);
    reset({ fromYm: "", percent: "" });
  });

  const remove = (fromYm: string) =>
    onSave(changes.filter((c) => c.fromYm !== fromYm));

  return (
    <View className="gap-3">
      <AppText variant="heading">Planlagte opsparings-ændringer</AppText>
      {changes.length > 0 ? (
        <View className="gap-2">
          {sortChanges(changes).map((c) => (
            <Card
              key={c.fromYm}
              className="flex-row items-center justify-between gap-3 py-3"
            >
              <View className="flex-1">
                <AppText variant="label">{c.percent}%</AppText>
                <AppText variant="muted" className="capitalize">
                  fra {formatMonthCopenhagen(`${c.fromYm}-01`)}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => remove(c.fromYm)}
              >
                <AppText className="text-sm text-danger">Fjern</AppText>
              </Pressable>
            </Card>
          ))}
        </View>
      ) : (
        <AppText variant="muted">Ingen — samme procent hele vejen.</AppText>
      )}

      <Card className="gap-3">
        <Controller
          control={control}
          name="fromYm"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Gælder fra (ÅÅÅÅ-MM)"
              error={errors.fromYm?.message}
            >
              <Input
                value={value}
                onChangeText={(t) => onChange(t.slice(0, 7))}
                onBlur={onBlur}
                placeholder="2027-01"
                autoCapitalize="none"
              />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="percent"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Ny procent (%)" error={errors.percent?.message}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                placeholder="30"
              />
            </FormField>
          )}
        />
        <Button title="Tilføj ændring" onPress={add} loading={isSubmitting} />
      </Card>
    </View>
  );
}
