import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { FormField } from '@/components/ui/form-field';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import {
  foodFormSchema,
  parseNumber,
  toFoodFormValues,
  toFoodInput,
  type FoodFormValues,
} from '../data/protein.schema';
import {
  FOOD_BASIS,
  MEAL_SLOTS,
  serving,
  type FoodBasis,
  type MealSlot,
  type ProteinFood,
  type ProteinFoodInput,
} from '../types';

export function FoodForm({
  food,
  submitLabel,
  onSubmit,
}: {
  food?: ProteinFood;
  submitLabel: string;
  onSubmit: (input: ProteinFoodInput) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FoodFormValues>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: toFoodFormValues(food),
  });

  const basis = useWatch({ control, name: 'basis' }) as FoodBasis;
  const proteinValue = useWatch({ control, name: 'proteinValue' }) ?? '';
  const kcalValue = useWatch({ control, name: 'kcalValue' }) ?? '';
  const portionG = useWatch({ control, name: 'portionG' }) ?? '';

  /**
   * Portionen regnet ud mens man taster.
   *
   * Uden den skriver man tallene fra pakken og aner ikke hvad posten kommer til at tælle
   * som — og pointen med at taste pr. 100 g er netop at slippe for at regne i hovedet. Så
   * skal svaret også stå der.
   */
  const preview = serving({
    basis,
    proteinValue: parseNumber(proteinValue),
    kcalValue: parseNumber(kcalValue),
    portionG: parseNumber(portionG) || undefined,
  });
  const showPreview = preview.kcal > 0 || preview.proteinG > 0;

  const submit = handleSubmit(async (values) => {
    await onSubmit(toFoodInput(values));
  });

  return (
    <View className="gap-4">
      <ControlledField
        control={control}
        name="name"
        label="Navn"
        error={errors.name?.message}
        placeholder="fx Skyr 0,2 % vanilje"
      />

      <Controller
        control={control}
        name="basis"
        render={({ field: { onChange, value } }) => (
          <FormField label="Tallene er">
            <View className="gap-2">
              <Segmented<FoodBasis> value={value} options={FOOD_BASIS} onChange={onChange} />
              <AppText variant="muted" className="text-xs">
                {value === 'per100g'
                  ? 'Skriv af fra emballagen, og sig hvor stor din portion er. Appen regner resten.'
                  : 'Til mad uden pakke — en ret du selv har lavet, tre æg, en portion aftensmad.'}
              </AppText>
            </View>
          </FormField>
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <ControlledField
            control={control}
            name="proteinValue"
            label={basis === 'per100g' ? 'Protein pr. 100 g' : 'Protein i portionen'}
            error={errors.proteinValue?.message}
            keyboardType="decimal-pad"
            placeholder="g"
          />
        </View>
        <View className="flex-1">
          <ControlledField
            control={control}
            name="kcalValue"
            label={basis === 'per100g' ? 'Kcal pr. 100 g' : 'Kcal i portionen'}
            error={errors.kcalValue?.message}
            keyboardType="number-pad"
            placeholder="kcal"
          />
        </View>
      </View>

      {basis === 'per100g' ? (
        <ControlledField
          control={control}
          name="portionG"
          label="Din portion"
          error={errors.portionG?.message}
          keyboardType="number-pad"
          placeholder="gram"
        />
      ) : null}

      {showPreview ? (
        <View className="gap-1 rounded-xl bg-element p-3">
          <AppText variant="muted" className="text-xs uppercase">
            Én portion bliver
          </AppText>
          <AppText className="text-xl font-semibold text-fg">
            {preview.proteinG} g protein · {preview.kcal} kcal
          </AppText>
        </View>
      ) : null}

      <Controller
        control={control}
        name="meal"
        render={({ field: { onChange, value } }) => (
          <FormField label="Foreslås under">
            <Segmented<MealSlot> value={value} options={MEAL_SLOTS} onChange={onChange} />
          </FormField>
        )}
      />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
