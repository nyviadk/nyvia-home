import { z } from 'zod';

import { todayISODate } from '@/lib/datetime';
import type { MonthlyDay, Recurrence } from './types';

/** Formularværdier for en gentagelse (flade felter til RHF). */
export const recurrenceFormSchema = z.object({
  cadence: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly', 'once']),
  monthlyDayKind: z.enum(['day', 'firstBank', 'lastBank', 'month']),
  // ÅÅÅÅ-MM (måned, ved bankdag/kun-måned) eller ÅÅÅÅ-MM-DD (bestemt dag / kvartal/år/engang).
  startDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Vælg en startdato'),
  // Valgfri slutdato (tom = ingen).
  endDate: z
    .string()
    .regex(/^(\d{4}-\d{2}(-\d{2})?)?$/, 'Ugyldig slutdato')
    .optional()
    .or(z.literal('')),
});

export type RecurrenceForm = z.infer<typeof recurrenceFormSchema>;

/** Normalisér ÅÅÅÅ-MM → ÅÅÅÅ-MM-01 (engine arbejder altid med fuld dato). */
export function normalizeDateInput(value: string): string {
  return value.length === 7 ? `${value}-01` : value;
}

/** Dag i måneden (1–31) fra en (fuld) dato-streng. */
function dayOfDate(value: string): number {
  const day = Number.parseInt(normalizeDateInput(value).slice(8, 10), 10);
  return Number.isFinite(day) ? Math.min(Math.max(day, 1), 31) : 1;
}

export function toRecurrence(form: RecurrenceForm): Recurrence {
  let monthlyDay: MonthlyDay | undefined;
  if (form.cadence === 'monthly') {
    // Ved "bestemt dag" udledes dagen af startdatoen; ellers er det selve bankdag-/måned-valget.
    monthlyDay = form.monthlyDayKind === 'day' ? dayOfDate(form.startDate) : form.monthlyDayKind;
  }
  const endDate = form.endDate?.trim() ? normalizeDateInput(form.endDate.trim()) : undefined;
  return {
    cadence: form.cadence,
    startDate: normalizeDateInput(form.startDate),
    ...(monthlyDay !== undefined ? { monthlyDay } : {}),
    ...(endDate ? { endDate } : {}),
  };
}

export function fromRecurrence(rule: Recurrence): RecurrenceForm {
  const kind =
    rule.monthlyDay === 'firstBank' ||
    rule.monthlyDay === 'lastBank' ||
    rule.monthlyDay === 'month'
      ? rule.monthlyDay
      : 'day';

  // For "bestemt dag" vises startdatoen med den gentagne dag (udledt af monthlyDay).
  let startDate = rule.startDate;
  if (rule.cadence === 'monthly' && kind === 'day' && typeof rule.monthlyDay === 'number') {
    startDate = `${rule.startDate.slice(0, 7)}-${String(rule.monthlyDay).padStart(2, '0')}`;
  }

  return {
    cadence: rule.cadence,
    monthlyDayKind: kind,
    startDate,
    endDate: rule.endDate ?? '',
  };
}

export function defaultRecurrenceForm(startDate?: string): RecurrenceForm {
  return {
    cadence: 'monthly',
    monthlyDayKind: 'day',
    startDate: startDate ?? todayISODate(),
    endDate: '',
  };
}
