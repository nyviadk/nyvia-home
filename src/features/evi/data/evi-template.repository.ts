import { nowISO } from '@/lib/datetime';
import { auth, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import type { EviField, EviTemplate } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

// Ét fast skabelon-dokument pr. bruger (ingen kollektion → én listener).
const templatePath = () => `users/${requireUid()}/evi/template`;

export function subscribeEviTemplate(
  onChange: (doc: WithId<EviTemplate> | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeDoc<EviTemplate>(templatePath(), onChange, onError);
}

/** Fjern undefined-nøgler rekursivt — Firestore afviser `undefined`-værdier i setDoc
 *  (fx `description.href = undefined` eller et ryddet `command`/`reuseKey`). */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => stripUndefined(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

/** Gemmer hele felt-listen (fuld erstatning). Løbende/silent — ingen toast pr. tast. */
export function saveEviTemplate(fields: EviField[]): Promise<void> {
  const clean = fields.map((f) => stripUndefined(f));
  return db.setDoc<EviTemplate>(templatePath(), { fields: clean, updatedAt: nowISO() }, true);
}
