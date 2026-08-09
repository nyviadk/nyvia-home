import { z } from 'zod';

import { normalizeDateInput, recurrenceFormSchema } from '@/lib/recurrence/recurrence-form';
import { ISO_DAY_OR_MONTH } from '@/lib/validation/fields';
import { useBudgetSettingsStore } from './budget-settings-store';

/**
 * Selve reglen: en gentagelses-startdato må ikke ligge før budgettets start.
 * Returnerer fejlteksten eller null. Delt, fordi budgetposter og abonnementer håndhæver
 * den fra hver sit skema — budget med en relakseret grænse for forudløn, abonnementer med
 * den rå. Kun grænsen og fejl-stien er forskellig; teksten skal være den samme.
 */
export function startBeforeMin(startDate: string, min: string | null): string | null {
  if (!min || !ISO_DAY_OR_MONTH.test(startDate)) return null;
  return normalizeDateInput(startDate) < min
    ? `Kan ikke være før budgettets start (${min})`
    : null;
}

/**
 * Gentagelses-skema med ekstra regel: startdatoen kan ikke ligge før budgettets
 * startdato (læses fra settings-store ved validering). Deles af budget + abonnementer,
 * så alt der fodrer budgettet respekterer samme nedre grænse.
 */
export const recurrenceWithBudgetStart = recurrenceFormSchema.superRefine((rec, ctx) => {
  const message = startBeforeMin(rec.startDate, useBudgetSettingsStore.getState().startDate);
  if (message) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message });
  }
});
