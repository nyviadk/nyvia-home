import { z } from 'zod';

import { genId } from '@/lib/id';
import { oreToKroner, parseKronerInput } from '@/lib/money';
import type { CustomLoanInput } from '../data/loans.repository';
import { emptyCustomLoan } from './default';
import type { CustomLoan } from './types';

const rowSchema = z.object({
  label: z.string(),
  amount: z.string(),
  note: z.string().optional(),
});

const lineItemSchema = z.object({
  // id + included round-trippes gennem formularen (redigeres i oversigtens filter,
  // ikke her), så de bevares når label/beløb redigeres.
  id: z.string(),
  label: z.string(),
  amount: z.string(),
  included: z.boolean(),
});

export const customFormSchema = z.object({
  name: z.string().trim().min(1, 'Navn kræves'),
  payeeRegNo: z.string(),
  payeeAccountNo: z.string(),
  payeeBankName: z.string(),
  lineItems: z.array(lineItemSchema),
  newHomeTitle: z.string(),
  newHomeRows: z.array(rowSchema),
  oldHomeTitle: z.string(),
  oldHomeRows: z.array(rowSchema),
  bufferAmount: z.string(),
  bufferEnabled: z.boolean(),
  horizon: z.enum(['asap', 'm24', 'm48']),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Brug formatet ÅÅÅÅ-MM'),
});

export type CustomFormValues = z.infer<typeof customFormSchema>;

const oreToStr = (ore: number) => String(oreToKroner(ore).toNumber());
const parse = (s: string) => parseKronerInput(s) ?? 0;

/** Eksisterende lån (eller tomt) → formularværdier (beløb som tekst). */
export function toFormValues(loan?: CustomLoan): CustomFormValues {
  const base = loan ?? { ...emptyCustomLoan(), createdAt: '', updatedAt: '' };
  return {
    name: base.name,
    payeeRegNo: base.payee.regNo,
    payeeAccountNo: base.payee.accountNo,
    payeeBankName: base.payee.bankName,
    lineItems: base.lineItems.map((i) => ({
      id: i.id,
      label: i.label,
      amount: oreToStr(i.amount),
      included: i.included,
    })),
    newHomeTitle: base.newHome.title,
    newHomeRows: base.newHome.rows.map((r) => ({
      label: r.label,
      amount: oreToStr(r.amount),
      note: r.note ?? '',
    })),
    oldHomeTitle: base.oldHome.title,
    oldHomeRows: base.oldHome.rows.map((r) => ({
      label: r.label,
      amount: oreToStr(r.amount),
      note: r.note ?? '',
    })),
    bufferAmount: oreToStr(base.buffer.amount),
    bufferEnabled: base.buffer.enabled,
    horizon: base.horizon,
    startMonth: base.startMonth,
  };
}

/**
 * Formularværdier → gemt model (parser beløb til øre, genererer id'er).
 * `existingActuals` bevares ved redigering (faktiske afdrag må ikke nulstilles).
 */
export function toCustomLoanInput(
  values: CustomFormValues,
  existingActuals: Record<string, number> = {}
): CustomLoanInput {
  return {
    type: 'custom',
    name: values.name.trim(),
    payee: {
      regNo: values.payeeRegNo.trim(),
      accountNo: values.payeeAccountNo.trim(),
      bankName: values.payeeBankName.trim(),
    },
    lineItems: values.lineItems.map((i) => ({
      id: i.id || genId(),
      label: i.label.trim(),
      amount: parse(i.amount),
      included: i.included,
    })),
    newHome: {
      title: values.newHomeTitle.trim() || 'Ny bolig',
      rows: values.newHomeRows.map((r) => ({
        id: genId(),
        label: r.label.trim(),
        amount: parse(r.amount),
        ...(r.note?.trim() ? { note: r.note.trim() } : {}),
      })),
    },
    oldHome: {
      title: values.oldHomeTitle.trim() || 'Nuværende bolig',
      rows: values.oldHomeRows.map((r) => ({
        id: genId(),
        label: r.label.trim(),
        amount: parse(r.amount),
        ...(r.note?.trim() ? { note: r.note.trim() } : {}),
      })),
    },
    buffer: { amount: parse(values.bufferAmount), enabled: values.bufferEnabled },
    horizon: values.horizon,
    startMonth: values.startMonth,
    actuals: existingActuals,
  };
}
