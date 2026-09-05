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
  "Transport",
  "Andet",
];

/**
 * Er posten transport?
 *
 * Kategorier er fri tekst, så der findes ikke et flag at slå op — navnet ER kendetegnet.
 * Derfor står "Transport" også i presets ovenfor: bruger man forslaget, staves det ens hver
 * gang, og filteret rammer. Sammenligningen er bevidst EKSAKT (efter trim og små bogstaver)
 * frem for "indeholder transport": et "Transport-API" er udvikling, ikke kørsel.
 *
 * Filteret viser hvor mange timer det skjuler, så en kategori der er stavet anderledes,
 * afslører sig selv med det samme — den tæller bare ikke med.
 */
export const TRANSPORT_KATEGORI = "Transport";

export const erTransport = (entry: { category: string }): boolean =>
  entry.category.trim().toLowerCase() === TRANSPORT_KATEGORI.toLowerCase();

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
