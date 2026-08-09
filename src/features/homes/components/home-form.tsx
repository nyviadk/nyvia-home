import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { DateField } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import {
  type HomeFormValues,
  homeFormSchema,
  toHomeFormValues,
  toHomeInput,
} from '../data/home.schema';
import { HOME_STATUSES, type Home, type HomeInput, type HomeStatus } from '../types';

export interface HomeFormProps {
  home?: Home;
  submitLabel: string;
  onSubmit: (input: HomeInput) => Promise<void>;
}

export function HomeForm({ home, submitLabel, onSubmit }: HomeFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HomeFormValues>({
    resolver: zodResolver(homeFormSchema),
    defaultValues: toHomeFormValues(home),
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(toHomeInput(values));
  });

  return (
    <View className="gap-4">
      <ControlledField control={control} name="address" label="Adresse"
        error={errors.address?.message} placeholder="Fx Honningvænget 160, 1.6" />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <ControlledField control={control} name="postalCode" label="Postnr." placeholder="8000" keyboardType="number-pad" />
        </View>
        <View className="flex-2">
          <ControlledField control={control} name="city" label="By" placeholder="Aarhus C" />
        </View>
      </View>

      <Controller
        control={control}
        name="status"
        render={({ field: { onChange, value } }) => (
          <FormField label="Status">
            <Segmented<HomeStatus> value={value} options={HOME_STATUSES} onChange={onChange} />
          </FormField>
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="moveInDate"
            render={({ field: { onChange, value } }) => (
              <FormField label="Indflytning (valgfri)">
                <DateField value={value ?? ''} onChange={onChange} placeholder="Vælg dato" />
              </FormField>
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="moveOutDate"
            render={({ field: { onChange, value } }) => (
              <FormField label="Fraflytning (valgfri)">
                <DateField value={value ?? ''} onChange={onChange} placeholder="Vælg dato" />
              </FormField>
            )}
          />
        </View>
      </View>

      <AppText variant="heading" className="pt-2">
        Udlejer (valgfri)
      </AppText>
      <ControlledField control={control} name="landlordName" label="Navn / firma" placeholder="Udlejer eller selskab" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <ControlledField control={control} name="landlordPhone" label="Telefon" placeholder="Tlf." keyboardType="phone-pad" />
        </View>
        <View className="flex-2">
          <ControlledField control={control} name="landlordEmail" label="E-mail" placeholder="udlejer@…" keyboardType="email-address" autoCapitalize="none" />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <ControlledField control={control} name="landlordRegNo" label="Reg.nr." placeholder="1234" keyboardType="number-pad" />
        </View>
        <View className="flex-2">
          <ControlledField control={control} name="landlordAccountNo" label="Kontonr." placeholder="0123456789" keyboardType="number-pad" />
        </View>
      </View>
      <ControlledField control={control} name="landlordAddress" label="Udlejers adresse" placeholder="Adresse" />
      <ControlledField control={control} name="landlordNotes" label="Noter" placeholder="Fx vilkår, kontaktperson" multiline />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
