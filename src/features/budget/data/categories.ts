import Fuse from "fuse.js";

import type { WithId } from "@/lib/firebase";
import type { BudgetEntry, BudgetEntryType } from "../types";

/** Hardcodede preset-kategorier pr. type (kan suppleres med frit indtastede). */
const INCOME_CATEGORIES = [
  "Løn",
  "Bonus",
  "Kørselspenge",
  "Side-gig",
  "SU",
  "Børnepenge",
  "Refusion",
  "Renter",
  "Diverse",
];

const EXPENSE_CATEGORIES = [
  "Husleje",
  "Aconto varme",
  "Aconto vand",
  "El",
  "Transport",
  "Mad",
  "Forsikring",
  "Skatteservice",
  "Internet",
  "Mobil",
  "Streaming",
  "Fitness",
  "Fagforening",
  "A-kasse",
  "Opsparing",
  "Afdrag",
  "Ai",
  "Diverse",
];

export function presetCategories(type: BudgetEntryType): string[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

/** Kategorier for en post (håndterer både ny `categories` og legacy `category`). */
export function entryCategories(
  entry: Pick<BudgetEntry, "categories" | "category">,
): string[] {
  if (entry.categories && entry.categories.length > 0) return entry.categories;
  return entry.category ? [entry.category] : [];
}

/**
 * Forslag = presets ∪ kategorier brugt i eksisterende poster (samme type), fuzzy-
 * filtreret på søgetekst (tåler slåfejl via Fuse.js). Allerede valgte udelades.
 * Ingen ekstra Firestore-samling.
 */
export function categorySuggestions(
  type: BudgetEntryType,
  entries: WithId<BudgetEntry>[],
  query: string,
  selected: string[] = [],
): string[] {
  const used = entries
    .filter((e) => e.type === type)
    .flatMap((e) => entryCategories(e).map((c) => c.trim()));
  const selectedLower = new Set(selected.map((c) => c.trim().toLowerCase()));
  const merged = Array.from(new Set([...presetCategories(type), ...used]))
    .filter(Boolean)
    .filter((c) => !selectedLower.has(c.toLowerCase()));
  const q = query.trim();
  if (!q) return merged.slice(0, 8);

  // ignoreLocation: match hvor som helst i ordet; threshold 0.45 tåler et par slåfejl
  // uden at blive for løst (fx "huslej"/"hsleje" → "Husleje", "div" → "Diverse").
  const fuse = new Fuse(merged, { threshold: 0.45, ignoreLocation: true });
  return fuse
    .search(q)
    .map((r) => r.item)
    .slice(0, 8);
}
