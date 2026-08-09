import { nowISO } from '@/lib/datetime';
import { db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { requireUid } from '@/lib/firebase/require-uid';
import { toastAfter } from '@/lib/toast/notify';
import type { TimetrackerSettings } from '../types';


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
