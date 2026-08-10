import { z } from 'zod';

import type { SpanishEntry, SpanishEntryInput, SpanishKind } from '../types';

export const spanishFormSchema = z.object({
  kind: z.enum(['ord', 'regel', 'saetning']),
  da: z.string().trim().min(1, 'Udfyld feltet'),
  es: z.string().trim().min(1, 'Udfyld feltet'),
  note: z.string().optional(),
});

export type SpanishFormValues = z.infer<typeof spanishFormSchema>;

export function toSpanishFormValues(entry?: SpanishEntry, kind: SpanishKind = 'ord'): SpanishFormValues {
  return {
    kind: entry?.kind ?? kind,
    da: entry?.da ?? '',
    es: entry?.es ?? '',
    note: entry?.note ?? '',
  };
}

export function toSpanishInput(values: SpanishFormValues): SpanishEntryInput {
  const note = values.note?.trim();
  return {
    kind: values.kind,
    da: values.da.trim(),
    es: values.es.trim(),
    ...(note ? { note } : {}),
  };
}
