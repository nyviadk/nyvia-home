import { z } from 'zod';

import { todayISODate } from '@/lib/datetime';
import type { MonthlyDay, Recurrence } from './types';

/** Formularværdier for en gentagelse (flade felter til RHF). */
export const recurrenceFormSchema = z.object({
  cadence: z.enum(['monthly', 'quarterly', 'yearly', 'once']),
  monthlyDayKind: z.enum(['day', 'firstBank', 'lastBank']),
  monthlyDayNumber: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Brug formatet ÅÅÅÅ-MM-DD'),
});

export type RecurrenceForm = z.infer<typeof recurrenceFormSchema>;

function clampDay(value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(n, 1), 28);
}

export function toRecurrence(form: RecurrenceForm): Recurrence {
  let monthlyDay: MonthlyDay | undefined;
  if (form.cadence === 'monthly') {
    monthlyDay = form.monthlyDayKind === 'day' ? clampDay(form.monthlyDayNumber) : form.monthlyDayKind;
  }
  return {
    cadence: form.cadence,
    startDate: form.startDate,
    ...(monthlyDay !== undefined ? { monthlyDay } : {}),
  };
}

export function fromRecurrence(rule: Recurrence): RecurrenceForm {
  const kind =
    rule.monthlyDay === 'firstBank' || rule.monthlyDay === 'lastBank' ? rule.monthlyDay : 'day';
  const number = typeof rule.monthlyDay === 'number' ? String(rule.monthlyDay) : '1';
  return {
    cadence: rule.cadence,
    monthlyDayKind: kind,
    monthlyDayNumber: number,
    startDate: rule.startDate,
  };
}

export function defaultRecurrenceForm(): RecurrenceForm {
  const today = todayISODate();
  return {
    cadence: 'monthly',
    monthlyDayKind: 'day',
    monthlyDayNumber: String(Number.parseInt(today.slice(8, 10), 10) || 1),
    startDate: today,
  };
}
