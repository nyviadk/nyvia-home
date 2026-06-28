import Fuse from "fuse.js";

import type { WithId } from "@/lib/firebase";
import type { TimeEntry } from "../types";

/** Hardcodede funktioner (kan suppleres med frit indtastede). */
const PRESET_FUNCTIONS = [
  "Udvikling",
  "Design",
  "Research",
  "Planlægning",
  "Test",
  "Bugfix",
  "Dokumentation",
  "Andet",
];

/**
 * Forslag = presets ∪ funktioner brugt i eksisterende poster, fuzzy-filtreret på
 * søgetekst (tåler slåfejl). Ingen ekstra Firestore-samling.
 */
export function categorySuggestions(
  entries: WithId<TimeEntry>[],
  query: string,
): string[] {
  const used = entries.map((e) => e.category.trim());
  const merged = Array.from(new Set([...PRESET_FUNCTIONS, ...used])).filter(
    Boolean,
  );
  const q = query.trim();
  if (!q) return merged.slice(0, 8);
  const fuse = new Fuse(merged, { threshold: 0.45, ignoreLocation: true });
  return fuse
    .search(q)
    .map((r) => r.item)
    .filter((c) => c.toLowerCase() !== q.toLowerCase())
    .slice(0, 8);
}
