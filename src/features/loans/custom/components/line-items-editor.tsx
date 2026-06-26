import { type Control, Controller, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';
import type { CustomFormValues } from '../form';

/**
 * Redigér lånets poster: label + beløb. Om en post medregnes (med/uden) styres
 * som et filter i oversigten — ikke her — så det kan justeres bagefter.
 */
export function LineItemsEditor({ control }: { control: Control<CustomFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  return (
    <View className="gap-3">
      <AppText variant="heading">Poster i lånet</AppText>
      {fields.map((field, index) => (
        <View key={field.id} className="gap-2 rounded-xl bg-element p-3">
          <Controller
            control={control}
            name={`lineItems.${index}.label`}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Beskrivelse" />
            )}
          />
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name={`lineItems.${index}.amount`}
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
            <Pressable accessibilityRole="button" onPress={() => remove(index)}>
              <AppText className="text-danger">Fjern</AppText>
            </Pressable>
          </View>
        </View>
      ))}
      <Button
        title="Tilføj post"
        variant="secondary"
        onPress={() => append({ id: '', label: '', amount: '', included: true })}
      />
    </View>
  );
}
