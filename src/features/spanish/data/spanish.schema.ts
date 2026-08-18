import { z } from 'zod';

import type { SpanishEntry, SpanishEntryInput, SpanishKind } from '../types';

export const spanishFormSchema = z.object({
  kind: z.enum(['ord', 'regel', 'saetning']),
  da: z.string().trim().min(1, 'Udfyld feltet'),
  es: z.string().trim().min(1, 'Udfyld feltet'),
  pron: z.string().optional(),
  note: z.string().optional(),
});

export type SpanishFormValues = z.infer<typeof spanishFormSchema>;

export function toSpanishFormValues(entry?: SpanishEntry, kind: SpanishKind = 'ord'): SpanishFormValues {
  return {
    kind: entry?.kind ?? kind,
    da: entry?.da ?? '',
    es: entry?.es ?? '',
    pron: entry?.pron ?? '',
    note: entry?.note ?? '',
  };
}

export function toSpanishInput(values: SpanishFormValues): SpanishEntryInput {
  // Tomme valgfrie felter udelades helt frem for at gemmes som "" — så er "har ingen note"
  // og "har en tom note" den samme tilstand, og læserne slipper for at teste på begge dele.
  const pron = values.pron?.trim();
  const note = values.note?.trim();
  return {
    kind: values.kind,
    da: values.da.trim(),
    es: values.es.trim(),
    ...(pron ? { pron } : {}),
    ...(note ? { note } : {}),
  };
}
