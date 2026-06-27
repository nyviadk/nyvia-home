import Fuse from 'fuse.js';

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
 * Forslag = presets ∪ kategorier brugt i eksisterende poster (samme type), fuzzy-
 * filtreret på søgetekst (tåler slåfejl via Fuse.js). Ingen ekstra Firestore-samling.
 */
export function categorySuggestions(
  type: BudgetEntryType,
  entries: WithId<BudgetEntry>[],
  query: string
): string[] {
  const used = entries.filter((e) => e.type === type).map((e) => e.category.trim());
  const merged = Array.from(new Set([...presetCategories(type), ...used])).filter(Boolean);
  const q = query.trim();
  if (!q) return merged.slice(0, 8);

  // ignoreLocation: match hvor som helst i ordet; threshold 0.45 tåler et par slåfejl
  // uden at blive for løst (fx "huslej"/"hsleje" → "Husleje", "div" → "Diverse").
  const fuse = new Fuse(merged, { threshold: 0.45, ignoreLocation: true });
  return fuse.search(q).map((r) => r.item).slice(0, 8);
}
