import { z } from 'zod';

import { genId } from '@/lib/id';
import { oreToKroner, parseKronerInput } from '@/lib/money';
import type { CustomLoanInput } from '../data/loans.repository';
import { emptyCustomLoan } from './default';
import type { CustomLoan } from './types';

/** Fortegn = kategori: negativt øre-beløb = indtægt, positivt = udgift. */
export type EntryKind = 'expense' | 'income';

export function kindOf(ore: number): EntryKind {
  return ore < 0 ? 'income' : 'expense';
}
function absStr(ore: number): string {
  return String(oreToKroner(Math.abs(ore)).toNumber());
}
export function toSignedOre(amountStr: string, kind: EntryKind): number {
  const magnitude = parseKronerInput(amountStr) ?? 0;
  return kind === 'income' ? -Math.abs(magnitude) : Math.abs(magnitude);
}

const kindSchema = z.enum(['expense', 'income']);

// Underposter arver postens kind (sættes af kassen posten ligger i) — ingen egen toggle.
const childSchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.string(),
});

const rowSchema = z.object({
  label: z.string(),
  amount: z.string(),
  kind: kindSchema,
  note: z.string().optional(),
});

const lineItemSchema = z.object({
  // id/included/children round-trippes (redigeres i oversigten, ikke i hovedformularen).
  id: z.string(),
  label: z.string(),
  amount: z.string(),
  kind: kindSchema,
  included: z.boolean(),
  children: z.array(childSchema),
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

/** Eksisterende lån (eller tomt) → formularværdier (positivt beløb + kind). */
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
      amount: absStr(i.amount),
      kind: kindOf(i.amount),
      included: i.included,
      children: (i.children ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        amount: absStr(c.amount),
      })),
    })),
    newHomeTitle: base.newHome.title,
    newHomeRows: base.newHome.rows.map((r) => ({
      label: r.label,
      amount: absStr(r.amount),
      kind: kindOf(r.amount),
      note: r.note ?? '',
    })),
    oldHomeTitle: base.oldHome.title,
    oldHomeRows: base.oldHome.rows.map((r) => ({
      label: r.label,
      amount: absStr(r.amount),
      kind: kindOf(r.amount),
      note: r.note ?? '',
    })),
    bufferAmount: oreToStr(base.buffer.amount),
    bufferEnabled: base.buffer.enabled,
    horizon: base.horizon,
    startMonth: base.startMonth,
  };
}

/**
 * Formularværdier → gemt model. Beløb signes ud fra kind. Har en post børn,
 * bliver dens beløb summen af dem. `existingActuals` bevares ved redigering.
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
    lineItems: values.lineItems.map((i) => {
      const children = i.children.map((c) => ({
        id: c.id || genId(),
        label: c.label.trim(),
        amount: toSignedOre(c.amount, i.kind),
      }));
      const amount = children.length
        ? children.reduce((sum, c) => sum + c.amount, 0)
        : toSignedOre(i.amount, i.kind);
      return {
        id: i.id || genId(),
        label: i.label.trim(),
        amount,
        included: i.included,
        ...(children.length ? { children } : {}),
      };
    }),
    newHome: {
      title: values.newHomeTitle.trim() || 'Ny bolig',
      rows: values.newHomeRows.map((r) => ({
        id: genId(),
        label: r.label.trim(),
        amount: toSignedOre(r.amount, r.kind),
        ...(r.note?.trim() ? { note: r.note.trim() } : {}),
      })),
    },
    oldHome: {
      title: values.oldHomeTitle.trim() || 'Nuværende bolig',
      rows: values.oldHomeRows.map((r) => ({
        id: genId(),
        label: r.label.trim(),
        amount: toSignedOre(r.amount, r.kind),
        ...(r.note?.trim() ? { note: r.note.trim() } : {}),
      })),
    },
    buffer: { amount: parseKronerInput(values.bufferAmount) ?? 0, enabled: values.bufferEnabled },
    horizon: values.horizon,
    startMonth: values.startMonth,
    actuals: existingActuals,
  };
}
