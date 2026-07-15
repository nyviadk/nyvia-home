import { formatDateCopenhagen } from '@/lib/datetime';
import type { Recurrence } from './types';

/** Kort, læsbar beskrivelse af en gentagelse, fx "Md · sidste bankdag". */
export function recurrenceLabel(rule: Recurrence): string {
  const stop = rule.endDate ? ` (til ${formatDateCopenhagen(rule.endDate)})` : '';
  switch (rule.cadence) {
    case 'once':
      return `Engang · ${formatDateCopenhagen(rule.startDate)}`;
    case 'quarterly':
      return `Kvartalsvis${stop}`;
    case 'half_yearly':
      return `Halvårligt${stop}`;
    case 'yearly':
      return `Årligt · ${formatDateCopenhagen(rule.startDate)}${stop}`;
    case 'biennial':
      return `Hvert 2. år · ${formatDateCopenhagen(rule.startDate)}${stop}`;
    case 'triennial':
      return `Hvert 3. år · ${formatDateCopenhagen(rule.startDate)}${stop}`;
    case 'monthly': {
      const day = rule.monthlyDay;
      const dayLabel =
        day === 'firstBank'
          ? 'første bankdag'
          : day === 'lastBank'
            ? 'sidste bankdag'
            : day === 'month'
              ? 'kun måned'
              : `d. ${day ?? ''}`;
      const interval = Math.max(1, Math.floor(rule.intervalMonths ?? 1));
      const every = interval === 1 ? 'Månedligt' : `Hver ${interval}. måned`;
      return `${every} · ${dayLabel}${stop}`;
    }
  }
}
