import { z } from 'zod';

import { parseKronerInput } from '@/lib/money';

/** Et beløbs-tekstfelt der skal parse til et ikke-negativt kronebeløb. */
const moneyField = (label: string) =>
  z.string().refine(
    (s) => {
      const ore = parseKronerInput(s);
      return ore !== null && ore >= 0;
    },
    { message: `${label} skal være et gyldigt beløb` }
  );

/** ISO-dato på formen YYYY-MM-DD. */
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Brug formatet ÅÅÅÅ-MM-DD');

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
