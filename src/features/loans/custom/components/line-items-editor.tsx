import { type Control, Controller, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { AppText } from "@/components/ui/text";
import { Pressable, View } from "@/tw";
import type { CustomFormValues, EntryKind } from "../form";

/**
 * Opretter lånets poster, opdelt i to kasser (Udgifter / Indtægter). Typen sættes
 * af kassen — ingen toggle. Underposter tilføjes senere via oversigtens redigering.
 */
export function LineItemsEditor({
  control,
}: {
  control: Control<CustomFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });
  const rows = fields.map((field, index) => ({ field, index }));

  const renderBox = (kind: EntryKind, title: string, addLabel: string) => (
    <View className="gap-2 rounded-xl border border-border p-3">
      <AppText variant="label">{title}</AppText>
      {rows
        .filter((r) => r.field.kind === kind)
        .map(({ field, index }) => (
          <View
            key={field.id}
            className="flex-row items-center gap-2 rounded-xl bg-element p-2"
          >
            <View className="flex-1">
              <Controller
                control={control}
                name={`lineItems.${index}.label`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Beskrivelse"
                  />
                )}
              />
            </View>
            <View className="w-24">
              <Controller
                control={control}
                name={`lineItems.${index}.amount`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <MoneyInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="kr."
                  />
                )}
              />
            </View>
            <Pressable accessibilityRole="button" onPress={() => remove(index)}>
              <AppText className="text-danger">✕</AppText>
            </Pressable>
          </View>
        ))}
      <Button
        title={addLabel}
        variant="secondary"
        onPress={() =>
          append({
            id: "",
            label: "",
            amount: "",
            kind,
            included: true,
            children: [],
          })
        }
      />
    </View>
  );

  return (
    <View className="gap-3">
      <AppText variant="heading">Poster i lånet</AppText>
      {renderBox("expense", "Udgifter", "Tilføj udgift")}
      {renderBox("income", "Indtægter", "Tilføj indtægt")}
    </View>
  );
}
