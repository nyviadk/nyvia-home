import { nowISO } from '@/lib/datetime';
import { auth, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { OwnAccount, ScrubRule, SpendingSettings } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

// Ét fast settings-dokument pr. bruger (ingen ekstra listener-spredning).
const settingsPath = () => `users/${requireUid()}/settings/spending`;

export function subscribeSpendingSettings(
  onChange: (doc: WithId<SpendingSettings> | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeDoc<SpendingSettings>(settingsPath(), onChange, onError);
}

/** Gemmer kun konti (bruges ved import, hvor rense-regler ikke skal røres). */
export function setOwnAccounts(accounts: OwnAccount[]): Promise<void> {
  return toastAfter(
    db.setDoc(settingsPath(), { accounts, updatedAt: nowISO() }, true),
    'Konti gemt'
  );
}

/** Gemmer konti + rense-regler i ét (indstillingssidens fælles Gem-knap). */
export function saveSpendingSettings(
  accounts: OwnAccount[],
  scrubRules: ScrubRule[]
): Promise<void> {
  return toastAfter(
    db.setDoc(settingsPath(), { accounts, scrubRules, updatedAt: nowISO() }, true),
    'Indstillinger gemt'
  );
}
