import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Switch, View } from '@/tw';
import type { CustomLoanInput } from '../../data/loans.repository';
import { type CustomFormValues, customFormSchema, toCustomLoanInput, toFormValues } from '../form';
import type { CustomLoan } from '../types';
import { ExpenseTableEditor } from './expense-table-editor';
import { LineItemsEditor } from './line-items-editor';

export interface CustomLoanFormProps {
  loan?: CustomLoan;
  submitLabel: string;
  onSubmit: (input: CustomLoanInput) => Promise<void>;
}

export function CustomLoanForm({ loan, submitLabel, onSubmit }: CustomLoanFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomFormValues>({
    resolver: zodResolver(customFormSchema),
    defaultValues: toFormValues(loan),
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(toCustomLoanInput(values, loan?.actuals));
  });

  return (
    <View className="gap-6">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Navn" error={errors.name?.message}>
            <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Fx Flytning Tilst" />
          </FormField>
        )}
      />

      <View className="gap-3">
        <AppText variant="heading">Udlejerens betaling</AppText>
        <Controller
          control={control}
          name="payeeBankName"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Banknavn">
              <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Fx Danske Bank" />
            </FormField>
          )}
        />
        <View className="flex-row gap-3">
          <View className="w-28">
            <Controller
              control={control}
              name="payeeRegNo"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField label="Reg.nr.">
                  <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="number-pad" placeholder="1234" />
                </FormField>
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="payeeAccountNo"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField label="Kontonr.">
                  <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="number-pad" placeholder="0123456789" />
                </FormField>
              )}
            />
          </View>
        </View>
      </View>

      <LineItemsEditor control={control} />

      <View className="gap-3">
        <AppText variant="heading">Udgifter — ny bolig</AppText>
        <ExpenseTableEditor control={control} rowsName="newHomeRows" titleName="newHomeTitle" />
      </View>

      <View className="gap-3">
        <AppText variant="heading">Udgifter — nuværende bolig</AppText>
        <ExpenseTableEditor control={control} rowsName="oldHomeRows" titleName="oldHomeTitle" />
      </View>

      <View className="gap-3">
        <AppText variant="heading">Afbetaling</AppText>
        <AppText variant="muted">Tidshorisont (hurtigst/24/48 mdr) vælges i afbetalingsplanen.</AppText>

        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Controller
              control={control}
              name="bufferAmount"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField label="Buffer / md. (kr.)">
                  <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="500" />
                </FormField>
              )}
            />
          </View>
          <View className="items-center gap-1">
            <AppText variant="muted">Aktiv</AppText>
            <Controller
              control={control}
              name="bufferEnabled"
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="startMonth"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Startmåned (ÅÅÅÅ-MM)" error={errors.startMonth?.message}>
              <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="2026-11" />
            </FormField>
          )}
        />
      </View>

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
