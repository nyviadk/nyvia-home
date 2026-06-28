import { type Control, Controller, useFieldArray } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { AppText } from "@/components/ui/text";
import { Pressable, View } from "@/tw";
import type { EntryKind } from "../form";

export type ChildForm = { id: string; label: string; amount: string };
export type ItemForm = {
  id: string;
  label: string;
  amount: string;
  /** Sættes af kassen (Udgift/Indtægt) posten ligger i — ingen toggle. */
  kind: EntryKind;
  children: ChildForm[];
};
export type ItemsForm = { items: ItemForm[] };

/** Redigér én post: label + beløb, eller opdel i underposter (summeres). Ingen type-toggle. */
export function LineItemEditRow({
  control,
  index,
  onRemove,
}: {
  control: Control<ItemsForm>;
  index: number;
  onRemove: () => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `items.${index}.children`,
  });
  const hasChildren = fields.length > 0;

  return (
    <View className="gap-2 rounded-xl bg-element p-3">
      <Controller
        control={control}
        name={`items.${index}.label`}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Beskrivelse"
          />
        )}
      />

      {hasChildren ? (
        <View className="gap-2">
          <AppText variant="muted">Underposter (summeres)</AppText>
          {fields.map((child, ci) => (
            <View key={child.id} className="flex-row items-center gap-2">
              <View className="flex-1">
                <Controller
                  control={control}
                  name={`items.${index}.children.${ci}.label`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Underpost"
                    />
                  )}
                />
              </View>
              <View className="w-24">
                <Controller
                  control={control}
                  name={`items.${index}.children.${ci}.amount`}
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
              <Pressable accessibilityRole="button" onPress={() => remove(ci)}>
                <AppText className="text-danger">✕</AppText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Controller
          control={control}
          name={`items.${index}.amount`}
          render={({ field: { onChange, onBlur, value } }) => (
            <MoneyInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="kr."
            />
          )}
        />
      )}

      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={() => append({ id: "", label: "", amount: "" })}
        >
          <AppText className="text-primary">+ Underpost</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onRemove}>
          <AppText className="text-danger">Fjern post</AppText>
        </Pressable>
      </View>
    </View>
  );
}
