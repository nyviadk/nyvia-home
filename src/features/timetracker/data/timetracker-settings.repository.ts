import { nowISO } from '@/lib/datetime';
import { auth, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { TimetrackerSettings } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const settingsPath = () => `users/${requireUid()}/settings/timetracker`;

export function subscribeTimetrackerSettings(
  onChange: (doc: WithId<TimetrackerSettings> | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeDoc<TimetrackerSettings>(settingsPath(), onChange, onError);
}

export function setOfficialStartDate(officialStartDate: string): Promise<void> {
  return toastAfter(
    db.setDoc(settingsPath(), { officialStartDate, updatedAt: nowISO() }, true),
    'Officiel startdato gemt'
  );
}
