import { type Control, useFieldArray } from "react-hook-form";

import { ControlledField } from "@/components/ui/controlled-field";
import { AppText } from "@/components/ui/text";
import { Pressable, View } from "@/tw";
import type { CustomFormValues, EntryKind } from "../form";
import { KindBox } from "./kind-box";

/**
 * Opretter lånets poster, opdelt i to kasser (Udgifter / Indtægter). Typen sættes
 * af kassen — ingen toggle. Underposter tilføjes senere via oversigtens redigering.
 */
export function LineItemsEditor({ control }: { control: Control<CustomFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

  const box = (kind: EntryKind, title: string, addLabel: string) => (
    <KindBox
      title={title}
      addLabel={addLabel}
      onAdd={() =>
        append({ id: "", label: "", amount: "", kind, included: true, children: [] })
      }>
      {fields.map((field, index) =>
        field.kind !== kind ? null : (
          <View
            key={field.id}
            className="flex-row items-center gap-2 rounded-xl bg-element p-2">
            <View className="flex-1">
              <ControlledField
                control={control}
                name={`lineItems.${index}.label`}
                placeholder="Beskrivelse"
              />
            </View>
            <View className="w-24">
              <ControlledField
                control={control}
                name={`lineItems.${index}.amount`}
                money
                placeholder="kr."
              />
            </View>
            <Pressable accessibilityRole="button" onPress={() => remove(index)}>
              <AppText className="text-danger">✕</AppText>
            </Pressable>
          </View>
        )
      )}
    </KindBox>
  );

  return (
    <View className="gap-3">
      <AppText variant="heading">Poster i lånet</AppText>
      {box("expense", "Udgifter", "Tilføj udgift")}
      {box("income", "Indtægter", "Tilføj indtægt")}
    </View>
  );
}
