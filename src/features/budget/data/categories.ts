import type { WithId } from '@/lib/firebase';
import type { BudgetEntry, BudgetEntryType } from '../types';

/** Hardcodede preset-kategorier pr. type (kan suppleres med frit indtastede). */
const INCOME_CATEGORIES = [
  'Løn',
  'Bonus',
  'Kørselspenge',
  'Side-gig',
  'SU',
  'Børnepenge',
  'Refusion',
  'Renter',
  'Diverse',
];

const EXPENSE_CATEGORIES = [
  'Husleje',
  'Aconto varme',
  'Aconto vand',
  'El',
  'Transport',
  'Mad',
  'Forsikring',
  'Internet',
  'Mobil',
  'Streaming',
  'Fitness',
  'Fagforening',
  'A-kasse',
  'Opsparing',
  'Afdrag',
  'Diverse',
];

export function presetCategories(type: BudgetEntryType): string[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

/**
 * Forslag = presets ∪ kategorier brugt i eksisterende poster (samme type), filtreret
 * på søgetekst (case-insensitivt "indeholder"). Ingen ekstra Firestore-samling.
 */
export function categorySuggestions(
  type: BudgetEntryType,
  entries: WithId<BudgetEntry>[],
  query: string
): string[] {
  const used = entries.filter((e) => e.type === type).map((e) => e.category.trim());
  const merged = Array.from(new Set([...presetCategories(type), ...used])).filter(Boolean);
  const q = query.trim().toLowerCase();
  const filtered = q ? merged.filter((c) => c.toLowerCase().includes(q)) : merged;
  return filtered.slice(0, 8);
}
