import { z } from 'zod';

import { todayISODate } from '@/lib/datetime';
import type { MonthlyDay, Recurrence } from './types';

/** Formularværdier for en gentagelse (flade felter til RHF). */
export const recurrenceFormSchema = z.object({
  cadence: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly', 'once']),
  monthlyDayKind: z.enum(['day', 'firstBank', 'lastBank', 'month']),
  monthlyDayNumber: z.string(),
  // Accepterer ÅÅÅÅ-MM (måned, for månedlige) eller ÅÅÅÅ-MM-DD.
  startDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Brug formatet ÅÅÅÅ-MM-DD'),
  // Valgfri slutdato (tom = ingen). ÅÅÅÅ-MM eller ÅÅÅÅ-MM-DD.
  endDate: z
    .string()
    .regex(/^(\d{4}-\d{2}(-\d{2})?)?$/, 'Brug formatet ÅÅÅÅ-MM')
    .optional()
    .or(z.literal('')),
});

export type RecurrenceForm = z.infer<typeof recurrenceFormSchema>;

function clampDay(value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(n, 1), 31);
}

/** Normalisér ÅÅÅÅ-MM → ÅÅÅÅ-MM-01 (engine arbejder altid med fuld dato). */
export function normalizeDateInput(value: string): string {
  return value.length === 7 ? `${value}-01` : value;
}

export function toRecurrence(form: RecurrenceForm): Recurrence {
  let monthlyDay: MonthlyDay | undefined;
  if (form.cadence === 'monthly') {
    monthlyDay = form.monthlyDayKind === 'day' ? clampDay(form.monthlyDayNumber) : form.monthlyDayKind;
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
  const number = typeof rule.monthlyDay === 'number' ? String(rule.monthlyDay) : '1';
  return {
    cadence: rule.cadence,
    monthlyDayKind: kind,
    monthlyDayNumber: number,
    startDate: rule.startDate,
    endDate: rule.endDate ?? '',
  };
}

export function defaultRecurrenceForm(startDate?: string): RecurrenceForm {
  const date = startDate ?? todayISODate();
  return {
    cadence: 'monthly',
    monthlyDayKind: 'day',
    monthlyDayNumber: String(Number.parseInt(date.slice(8, 10), 10) || 1),
    startDate: date,
    endDate: '',
  };
}
