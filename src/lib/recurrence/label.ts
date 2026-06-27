import { formatDateCopenhagen } from '@/lib/datetime';
import type { Recurrence } from './types';

/** Kort, læsbar beskrivelse af en gentagelse, fx "Md · sidste bankdag". */
export function recurrenceLabel(rule: Recurrence): string {
  switch (rule.cadence) {
    case 'once':
      return `Engang · ${formatDateCopenhagen(rule.startDate)}`;
    case 'quarterly':
      return 'Kvartalsvis';
    case 'yearly':
      return `Årligt · ${formatDateCopenhagen(rule.startDate)}`;
    case 'monthly': {
      const day = rule.monthlyDay;
      const dayLabel =
        day === 'firstBank'
          ? 'første bankdag'
          : day === 'lastBank'
            ? 'sidste bankdag'
            : `d. ${day ?? ''}`;
      return `Månedligt · ${dayLabel}`;
    }
  }
}
