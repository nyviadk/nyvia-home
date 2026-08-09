import { z } from 'zod';

import { dateField, moneyField } from '@/lib/validation/fields';

export const loanFormSchema = z.object({
  name: z.string().trim().min(1, 'Navn kræves'),
  lender: z.string().trim().min(1, 'Långiver kræves'),
  originalAmount: moneyField('Oprindeligt beløb'),
  currentBalance: moneyField('Restgæld'),
  interestRate: z
    .string()
    .refine((s) => s.trim() === '' || !Number.isNaN(Number(s.replace(',', '.'))), 'Ugyldig rente'),
  monthlyPayment: moneyField('Ydelse'),
  startDate: dateField,
});

export type LoanFormValues = z.infer<typeof loanFormSchema>;

export const paymentFormSchema = z.object({
  amount: moneyField('Beløb'),
  date: dateField,
  note: z.string().trim().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
