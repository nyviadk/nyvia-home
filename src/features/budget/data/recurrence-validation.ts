import { z } from 'zod';

import { normalizeDateInput, recurrenceFormSchema } from '@/lib/recurrence/recurrence-form';
import { useBudgetSettingsStore } from './budget-settings-store';

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

/**
 * Gentagelses-skema med ekstra regel: startdatoen kan ikke ligge før budgettets
 * startdato (læses fra settings-store ved validering). Deles af budget + abonnementer,
 * så alt der fodrer budgettet respekterer samme nedre grænse.
 */
export const recurrenceWithBudgetStart = recurrenceFormSchema.superRefine((rec, ctx) => {
  const min = useBudgetSettingsStore.getState().startDate;
  const start = normalizeDateInput(rec.startDate);
  if (min && ISO_DATE.test(rec.startDate) && start < min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: `Kan ikke være før budgettets start (${min})`,
    });
  }
});
