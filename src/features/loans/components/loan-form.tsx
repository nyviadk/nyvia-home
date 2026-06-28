import { zodResolver } from "@hookform/resolvers/zod";
import BigNumber from "bignumber.js";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { todayISODate } from "@/lib/datetime";
import { oreToInput, parseKronerInput } from "@/lib/money";
import { View } from "@/tw";
import { type LoanFormValues, loanFormSchema } from "../data/loans.schema";
import type { Loan, LoanInput } from "../types";

function toFormValues(loan?: Loan): LoanFormValues {
  if (!loan) {
    return {
      name: "",
      lender: "",
      originalAmount: "",
      currentBalance: "",
      interestRate: "",
      monthlyPayment: "",
      startDate: todayISODate(),
    };
  }
  return {
    name: loan.name,
    lender: loan.lender,
    originalAmount: oreToInput(loan.originalAmount),
    currentBalance: oreToInput(loan.currentBalance),
    interestRate: String(loan.interestRate),
    monthlyPayment: oreToInput(loan.monthlyPayment),
    startDate: loan.startDate,
  };
}

export interface LoanFormProps {
  loan?: Loan;
  submitLabel: string;
  onSubmit: (input: LoanInput) => Promise<void>;
}

export function LoanForm({ loan, submitLabel, onSubmit }: LoanFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: toFormValues(loan),
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      lender: values.lender.trim(),
      originalAmount: parseKronerInput(values.originalAmount) ?? 0,
      currentBalance: parseKronerInput(values.currentBalance) ?? 0,
      interestRate:
        new BigNumber(
          (values.interestRate || "0").replace(",", "."),
        ).toNumber() || 0,
      monthlyPayment: parseKronerInput(values.monthlyPayment) ?? 0,
      startDate: values.startDate,
    });
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Navn" error={errors.name?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.name}
              placeholder="Fx SU-lån"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="lender"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Långiver" error={errors.lender?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.lender}
              placeholder="Fx Udbetaling Danmark"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="originalAmount"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Oprindeligt beløb (kr.)"
            error={errors.originalAmount?.message}
          >
            <MoneyInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.originalAmount}
              placeholder="80.000"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="currentBalance"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Restgæld (kr.)"
            error={errors.currentBalance?.message}
          >
            <MoneyInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.currentBalance}
              placeholder="42.000"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="interestRate"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Rente (% p.a.)"
            error={errors.interestRate?.message}
          >
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.interestRate}
              keyboardType="decimal-pad"
              placeholder="4,2"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="monthlyPayment"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Ydelse / md. (kr.)"
            error={errors.monthlyPayment?.message}
          >
            <MoneyInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.monthlyPayment}
              placeholder="1.200"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="startDate"
        render={({ field: { onChange, value } }) => (
          <FormField label="Startdato" error={errors.startDate?.message}>
            <DateField value={value} onChange={onChange} invalid={!!errors.startDate} />
          </FormField>
        )}
      />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
