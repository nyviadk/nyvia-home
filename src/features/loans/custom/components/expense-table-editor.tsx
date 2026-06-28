import { type Control, Controller, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { AppText } from "@/components/ui/text";
import { Pressable, View } from "@/tw";
import type { CustomFormValues, EntryKind } from "../form";

type RowsName = "newHomeRows" | "oldHomeRows";
type TitleName = "newHomeTitle" | "oldHomeTitle";

export interface ExpenseTableEditorProps {
  control: Control<CustomFormValues>;
  rowsName: RowsName;
  titleName: TitleName;
}

/** Redigér en udgiftstabel: titel + to kasser (Udgifter / Indtægter). Type via kassen. */
export function ExpenseTableEditor({
  control,
  rowsName,
  titleName,
}: ExpenseTableEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: rowsName });
  const rows = fields.map((field, index) => ({ field, index }));

  const renderBox = (kind: EntryKind, title: string, addLabel: string) => (
    <View className="gap-2 rounded-xl border border-border p-3">
      <AppText variant="label">{title}</AppText>
      {rows
        .filter((r) => r.field.kind === kind)
        .map(({ field, index }) => (
          <View key={field.id} className="gap-2 rounded-xl bg-element p-2">
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Controller
                  control={control}
                  name={`${rowsName}.${index}.label`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Post"
                    />
                  )}
                />
              </View>
              <View className="w-24">
                <Controller
                  control={control}
                  name={`${rowsName}.${index}.amount`}
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
              <Pressable
                accessibilityRole="button"
                onPress={() => remove(index)}
              >
                <AppText className="text-danger">✕</AppText>
              </Pressable>
            </View>
            <Controller
              control={control}
              name={`${rowsName}.${index}.note`}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Note (valgfri)"
                />
              )}
            />
          </View>
        ))}
      <Button
        title={addLabel}
        variant="secondary"
        onPress={() => append({ label: "", amount: "", kind, note: "" })}
      />
    </View>
  );

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name={titleName}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Tabel-titel"
          />
        )}
      />
      {renderBox("expense", "Udgifter", "Tilføj udgift")}
      {renderBox("income", "Indtægter", "Tilføj indtægt")}
    </View>
  );
}
