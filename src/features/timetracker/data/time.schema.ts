import { z } from 'zod';

import { todayISODate } from '@/lib/datetime';
import { durationFromTimes, parseHm } from '../time.utils';
import type { TimeEntry, TimeEntryInput } from '../types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const timeField = z.string().refine((s) => parseHm(s) !== null, 'Brug HH:mm');

export const timeFormSchema = z
  .object({
    date: z
      .string()
      .regex(ISO_DATE, 'Brug ÅÅÅÅ-MM-DD')
      .refine((d) => d <= todayISODate(), 'Kan ikke være i fremtiden'),
    startTime: timeField,
    endTime: timeField,
    category: z.string().trim().min(1, 'Vælg en funktion'),
    description: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (
      parseHm(values.startTime) !== null &&
      parseHm(values.endTime) !== null &&
      durationFromTimes(values.startTime, values.endTime) <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Sluttid skal give en varighed (lig start = 0)',
      });
    }
  });

export type TimeFormValues = z.infer<typeof timeFormSchema>;

export function toTimeFormValues(entry?: TimeEntry): TimeFormValues {
  if (!entry) {
    return { date: todayISODate(), startTime: '', endTime: '', category: '', description: '' };
  }
  return {
    date: entry.date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    category: entry.category,
    description: entry.description ?? '',
  };
}

export function toTimeInput(values: TimeFormValues): TimeEntryInput {
  const description = values.description?.trim();
  return {
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    durationMinutes: durationFromTimes(values.startTime, values.endTime),
    category: values.category.trim(),
    ...(description ? { description } : {}),
  };
}
