import { type Control, useFieldArray } from "react-hook-form";

import { ControlledField } from "@/components/ui/controlled-field";
import { AppText } from "@/components/ui/text";
import { Pressable, View } from "@/tw";
import type { CustomFormValues, EntryKind } from "../form";
import { KindBox } from "./kind-box";

type RowsName = "newHomeRows" | "oldHomeRows";
type TitleName = "newHomeTitle" | "oldHomeTitle";

export interface ExpenseTableEditorProps {
  control: Control<CustomFormValues>;
  rowsName: RowsName;
  titleName: TitleName;
}

/** Redigér en udgiftstabel: titel + to kasser (Udgifter / Indtægter). Type via kassen. */
export function ExpenseTableEditor({ control, rowsName, titleName }: ExpenseTableEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: rowsName });

  const box = (kind: EntryKind, title: string, addLabel: string) => (
    <KindBox
      title={title}
      addLabel={addLabel}
      onAdd={() => append({ label: "", amount: "", kind, note: "" })}>
      {fields.map((field, index) =>
        field.kind !== kind ? null : (
          <View key={field.id} className="gap-2 rounded-xl bg-element p-2">
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <ControlledField
                  control={control}
                  name={`${rowsName}.${index}.label`}
                  placeholder="Post"
                />
              </View>
              <View className="w-24">
                <ControlledField
                  control={control}
                  name={`${rowsName}.${index}.amount`}
                  money
                  placeholder="kr."
                />
              </View>
              <Pressable accessibilityRole="button" onPress={() => remove(index)}>
                <AppText className="text-danger">✕</AppText>
              </Pressable>
            </View>
            <ControlledField
              control={control}
              name={`${rowsName}.${index}.note`}
              placeholder="Note (valgfri)"
            />
          </View>
        )
      )}
    </KindBox>
  );

  return (
    <View className="gap-3">
      <ControlledField control={control} name={titleName} placeholder="Tabel-titel" />
      {box("expense", "Udgifter", "Tilføj udgift")}
      {box("income", "Indtægter", "Tilføj indtægt")}
    </View>
  );
}
