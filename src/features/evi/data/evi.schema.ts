import { z } from 'zod';

import type { EviField } from '../types';

/**
 * Defensiv normalisering af skabelonen fra Firestore. Skabelonen udvikler sig over tid
 * (nye felt-typer/egenskaber), så vi validerer hvert felt og DROPPER kun de ugyldige —
 * resten består. Det gør gamle/delvist ukendte dokumenter bagudkompatible.
 */
const descriptionSchema = z.object({
  text: z.string(),
  href: z.string().optional(),
});

const fieldTypeSchema = z.enum([
  'text',
  'longtext',
  'date',
  'checkbox',
  'checklist',
  'choice',
  'sensitive',
]);

// Annoteret med EviField, så skemaet og domænetypen ikke kan drive fra hinanden i tavshed:
// tilføjes et påkrævet felt i typen uden at skemaet følger med, fejler dette ved compile.
// Typen (og dens dokumentation) bliver i types.ts — skemaet er kun input-validering.
const fieldSchema: z.ZodType<EviField> = z.object({
  id: z.string().min(1),
  label: z.string(),
  type: fieldTypeSchema,
  description: descriptionSchema.optional(),
  command: z.string().optional(),
  options: z.array(z.string()).optional(),
  section: z.string().optional(),
  pinned: z.boolean().optional(),
  reuseKey: z.string().optional(),
  showReuse: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
});

/** Læs felt-listen fra et skabelon-dokument, robust mod ukendte/ugyldige felter. */
export function parseTemplateFields(
  raw: { fields?: unknown } | null | undefined,
): EviField[] {
  if (!raw || !Array.isArray(raw.fields)) return [];
  const out: EviField[] = [];
  for (const f of raw.fields) {
    const parsed = fieldSchema.safeParse(f);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
