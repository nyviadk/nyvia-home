import { nowISO } from '@/lib/datetime';
import { db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { requireUid } from '@/lib/firebase/require-uid';
import type { UvPlace, UvSettings } from '../types';


/**
 * Ét fast dokument pr. bruger — i SAMME `settings`-kollektion som budget, så de eksisterende
 * Firestore-rules dækker det uden ændringer.
 */
const settingsPath = () => `users/${requireUid()}/settings/uv`;

export function subscribeUvSettings(
  onChange: (doc: WithId<UvSettings> | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeDoc<UvSettings>(settingsPath(), onChange, onError);
}

/** Skriver hele steds-listen (fuld erstatning) + hvilket sted varslerne følger. */
export function saveUvSettings(places: UvPlace[], notifyPlaceId: string | null): Promise<void> {
  return db.setDoc<UvSettings>(
    settingsPath(),
    // `?? null` — Firestore afviser undefined-værdier.
    { places, notifyPlaceId: notifyPlaceId ?? null, updatedAt: nowISO() },
    true,
  );
}
