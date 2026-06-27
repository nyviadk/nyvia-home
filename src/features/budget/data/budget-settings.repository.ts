import { nowISO } from '@/lib/datetime';
import { auth, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { BudgetSettings } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

// Ét fast settings-dokument pr. bruger (ingen kollektion → ingen ekstra listener-spredning).
const settingsPath = () => `users/${requireUid()}/settings/budget`;

export function subscribeBudgetSettings(
  onChange: (doc: WithId<BudgetSettings> | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeDoc<BudgetSettings>(settingsPath(), onChange, onError);
}

export function setBudgetStartDate(startDate: string): Promise<void> {
  return toastAfter(
    db.setDoc<BudgetSettings>(settingsPath(), { startDate, updatedAt: nowISO() }, true),
    'Budget-startdato gemt'
  );
}
