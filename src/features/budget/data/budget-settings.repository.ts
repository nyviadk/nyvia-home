import { nowISO } from '@/lib/datetime';
import { auth, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { BudgetSettings, SavingsPercentChange } from '../types';

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

export function setSavingsPercent(savingsPercent: number): Promise<void> {
  return toastAfter(
    db.setDoc(settingsPath(), { savingsPercent, updatedAt: nowISO() }, true),
    'Opsparing gemt'
  );
}

/** Skriver hele listen af fremadrettede procent-ændringer (fuld erstatning). */
export async function setSavingsPercentChanges(
  savingsPercentChanges: SavingsPercentChange[]
): Promise<void> {
  try {
    await db.updateDoc(settingsPath(), { savingsPercentChanges, updatedAt: nowISO() });
  } catch {
    await db.setDoc(settingsPath(), { savingsPercentChanges, updatedAt: nowISO() }, true);
  }
}

/** Skriver hele faktisk-opsparing-kortet (fuld erstatning, så en måned kan ryddes). */
export async function setSavingsActuals(savingsActuals: Record<string, number>): Promise<void> {
  try {
    await db.updateDoc(settingsPath(), { savingsActuals, updatedAt: nowISO() });
  } catch {
    // Dokumentet findes endnu ikke → opret det.
    await db.setDoc(settingsPath(), { savingsActuals, updatedAt: nowISO() }, true);
  }
}
