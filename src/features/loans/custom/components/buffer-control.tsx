import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/ui/form-field";
import { MoneyInput } from "@/components/ui/money-input";
import { AppText } from "@/components/ui/text";
import type { WithId } from "@/lib/firebase";
import { oreToInput, parseKronerInput } from "@/lib/money";
import { Switch, View } from "@/tw";
import { updateCustomBuffer } from "../../data/loans.repository";
import type { CustomLoan } from "../types";

type BufferForm = { amount: string; enabled: boolean };

/**
 * Buffer-kontrol — vises kun ved "hurtigst muligt" (irrelevant ved 24/48 mdr).
 * Gemmer on blur/toggle og genberegner planen live.
 */
export function BufferControl({ loan }: { loan: WithId<CustomLoan> }) {
  const { control, getValues } = useForm<BufferForm>({
    defaultValues: {
      amount: oreToInput(loan.buffer.amount),
      enabled: loan.buffer.enabled,
    },
  });

  function save(amount: string, enabled: boolean) {
    const amountOre = parseKronerInput(amount) ?? 0;
    if (amountOre === loan.buffer.amount && enabled === loan.buffer.enabled)
      return;
    void updateCustomBuffer(loan.id, { amount: amountOre, enabled });
  }

  return (
    <View className="flex-row items-end justify-between gap-3">
      <View className="flex-1">
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Buffer / md. (kr.)">
              <MoneyInput
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  onBlur();
                  save(value, getValues("enabled"));
                }}
                placeholder="500"
              />
            </FormField>
          )}
        />
      </View>
      <View className="items-center gap-1 pb-2">
        <AppText variant="muted">Aktiv</AppText>
        <Controller
          control={control}
          name="enabled"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={value}
              onValueChange={(next) => {
                onChange(next);
                save(getValues("amount"), next);
              }}
            />
          )}
        />
      </View>
    </View>
  );
}
