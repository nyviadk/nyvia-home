import { formatDateCopenhagen } from '@/lib/datetime';
import type { EviAnswerValue, EviField } from './types';

/** Formatér et svar til visnings-tekst (nøgle-kort, liste-undertekster). */
export function formatAnswerText(field: EviField, value: EviAnswerValue | undefined): string {
  if (value === undefined || value === null) return '';
  switch (field.type) {
    case 'date':
      return typeof value === 'string' && value ? formatDateCopenhagen(`${value}T00:00:00`) : '';
    case 'checkbox':
      return value === true ? 'Ja' : '';
    case 'checklist':
      return Array.isArray(value) ? value.join(', ') : '';
    case 'sensitive':
      return '••••';
    default:
      return typeof value === 'string' ? value : '';
  }
}
