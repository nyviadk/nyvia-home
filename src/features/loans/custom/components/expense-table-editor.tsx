import { type Control, Controller, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';
import type { CustomFormValues } from '../form';

type RowsName = 'newHomeRows' | 'oldHomeRows';
type TitleName = 'newHomeTitle' | 'oldHomeTitle';

export interface ExpenseTableEditorProps {
  control: Control<CustomFormValues>;
  rowsName: RowsName;
  titleName: TitleName;
}

/** Redigér en udgiftstabel: titel + rækker (label, beløb, fritekst-note). */
export function ExpenseTableEditor({ control, rowsName, titleName }: ExpenseTableEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: rowsName });

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name={titleName}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Tabel-titel" />
        )}
      />
      {fields.map((field, index) => (
        <View key={field.id} className="gap-2 rounded-xl bg-element p-3">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Controller
                control={control}
                name={`${rowsName}.${index}.label`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Post" />
                )}
              />
            </View>
            <View className="w-28">
              <Controller
                control={control}
                name={`${rowsName}.${index}.amount`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    placeholder="kr."
                  />
                )}
              />
            </View>
          </View>
          <Controller
            control={control}
            name={`${rowsName}.${index}.note`}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Note (valgfri)"
              />
            )}
          />
          <Pressable accessibilityRole="button" onPress={() => remove(index)}>
            <AppText className="text-danger">Fjern</AppText>
          </Pressable>
        </View>
      ))}
      <Button
        title="Tilføj række"
        variant="secondary"
        onPress={() => append({ label: '', amount: '', note: '' })}
      />
    </View>
  );
}
