import { zodResolver } from '@hookform/resolvers/zod';
import { type Control, Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
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
      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Adresse" error={errors.address?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Fx Honningvænget 160, 1.6"
            />
          </FormField>
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FieldInput control={control} name="postalCode" label="Postnr." placeholder="8000" keyboard="number-pad" />
        </View>
        <View className="flex-2">
          <FieldInput control={control} name="city" label="By" placeholder="Aarhus C" />
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
      <FieldInput control={control} name="landlordName" label="Navn / firma" placeholder="Udlejer eller selskab" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FieldInput control={control} name="landlordPhone" label="Telefon" placeholder="Tlf." keyboard="phone-pad" />
        </View>
        <View className="flex-2">
          <FieldInput control={control} name="landlordEmail" label="E-mail" placeholder="udlejer@…" keyboard="email-address" />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FieldInput control={control} name="landlordRegNo" label="Reg.nr." placeholder="1234" keyboard="number-pad" />
        </View>
        <View className="flex-2">
          <FieldInput control={control} name="landlordAccountNo" label="Kontonr." placeholder="0123456789" keyboard="number-pad" />
        </View>
      </View>
      <FieldInput control={control} name="landlordAddress" label="Udlejers adresse" placeholder="Adresse" />
      <FieldInput control={control} name="landlordNotes" label="Noter" placeholder="Fx vilkår, kontaktperson" multiline />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}

/** Genbrug for de mange (valgfrie) tekst-felter. */
function FieldInput({
  control,
  name,
  label,
  placeholder,
  keyboard,
  multiline,
}: {
  control: Control<HomeFormValues>;
  name: keyof HomeFormValues;
  label: string;
  placeholder: string;
  keyboard?: 'phone-pad' | 'number-pad' | 'email-address';
  multiline?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <FormField label={label}>
          <Input
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            keyboardType={keyboard}
            autoCapitalize={keyboard === 'email-address' ? 'none' : undefined}
            multiline={multiline}
            className={multiline ? 'h-auto min-h-20 py-3' : undefined}
            textAlignVertical={multiline ? 'top' : undefined}
          />
        </FormField>
      )}
    />
  );
}
