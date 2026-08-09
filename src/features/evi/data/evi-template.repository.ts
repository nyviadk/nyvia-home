import { nowISO } from '@/lib/datetime';
import { db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { omitUndefined } from '@/lib/firebase/omit-undefined';
import { requireUid } from '@/lib/firebase/require-uid';
import type { EviField, EviTemplate } from '../types';

// Ét fast skabelon-dokument pr. bruger (ingen kollektion → én listener).
const templatePath = () => `users/${requireUid()}/evi/template`;

export function subscribeEviTemplate(
  onChange: (doc: WithId<EviTemplate> | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeDoc<EviTemplate>(templatePath(), onChange, onError);
}

/** Gemmer hele felt-listen (fuld erstatning). Løbende/silent — ingen toast pr. tast. */
export function saveEviTemplate(fields: EviField[]): Promise<void> {
  const clean = fields.map((f) => omitUndefined(f));
  return db.setDoc<EviTemplate>(templatePath(), { fields: clean, updatedAt: nowISO() }, true);
}
