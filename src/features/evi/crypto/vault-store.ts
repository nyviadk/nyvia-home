import { create } from 'zustand';

import { auth, db } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import type { EviCipher, EviVaultConfig } from '../types';
import {
  createVault,
  decryptField,
  encryptField,
  rewrapVault,
  unlockVault,
  vaultAvailable,
  WrongPassphraseError,
} from './vault';

/**
 * Boks-tilstand for følsomme felter. DEK'en holdes KUN i hukommelsen (aldrig persisteret),
 * så et reload altid låser. Auto-lås efter inaktivitet + når fanen skjules. Følsomme felter
 * kræver internet — vi låser ikke op offline (bevidst, jf. krav).
 */
const AUTO_LOCK_MS = 5 * 60_000;

export type VaultStatus = 'unknown' | 'unavailable' | 'absent' | 'locked' | 'unlocked';

interface VaultState {
  status: VaultStatus;
  /** Data-nøglen — kun i hukommelsen, aldrig i persist-lag. */
  dek: CryptoKey | null;
}

export const useEviVaultStore = create<VaultState>(() => ({
  status: vaultAvailable ? 'unknown' : 'unavailable',
  dek: null,
}));

export { WrongPassphraseError };

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const vaultPath = () => `users/${requireUid()}/evi/vault`;

function assertOnline(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Kræver internet — følsomme felter kan kun tilgås online.');
  }
}

let lockTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleAutoLock(): void {
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = setTimeout(lockVault, AUTO_LOCK_MS);
}

/** Læs om boksen findes (locked) eller ej (absent). Rører ikke en åben boks. */
export async function refreshVaultStatus(): Promise<void> {
  if (!vaultAvailable) return;
  if (useEviVaultStore.getState().status === 'unlocked') return;
  try {
    const cfg = await db.getDoc<EviVaultConfig>(vaultPath());
    useEviVaultStore.setState({ status: cfg ? 'locked' : 'absent' });
  } catch {
    // netværks-/rettighedsfejl → lad status være (unknown), UI kan prøve igen
  }
}

/** Første gang: opret boksen med en valgt adgangssætning. */
export async function setupVault(passphrase: string): Promise<void> {
  assertOnline();
  const { config, dek } = await createVault(passphrase);
  await db.setDoc(vaultPath(), { ...config }, false);
  useEviVaultStore.setState({ status: 'unlocked', dek });
  scheduleAutoLock();
}

/** Lås op med adgangssætningen (henter config; kaster WrongPassphraseError ved fejl). */
export async function unlockVaultWith(passphrase: string): Promise<void> {
  assertOnline();
  const cfg = await db.getDoc<EviVaultConfig>(vaultPath());
  if (!cfg) throw new Error('Der er ingen boks endnu.');
  const dek = await unlockVault(passphrase, cfg);
  useEviVaultStore.setState({ status: 'unlocked', dek });
  scheduleAutoLock();
}

/** Skift adgangssætning (re-wrapper DEK — ingen om-kryptering af felter). */
export async function changeVaultPassphrase(
  oldPassphrase: string,
  newPassphrase: string,
): Promise<void> {
  assertOnline();
  const cfg = await db.getDoc<EviVaultConfig>(vaultPath());
  if (!cfg) throw new Error('Der er ingen boks endnu.');
  const next = await rewrapVault(oldPassphrase, newPassphrase, cfg);
  await db.setDoc(vaultPath(), { ...next }, false);
}

export function lockVault(): void {
  if (lockTimer) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
  const absent = useEviVaultStore.getState().status === 'absent';
  useEviVaultStore.setState({ dek: null, status: absent ? 'absent' : 'locked' });
}

export async function encryptValue(plaintext: string): Promise<EviCipher> {
  const dek = useEviVaultStore.getState().dek;
  if (!dek) throw new Error('Boksen er låst');
  scheduleAutoLock();
  return encryptField(dek, plaintext);
}

export async function decryptValue(cipher: EviCipher): Promise<string> {
  const dek = useEviVaultStore.getState().dek;
  if (!dek) throw new Error('Boksen er låst');
  scheduleAutoLock();
  return decryptField(dek, cipher);
}

// Lås ved fane-skift (web) og ved logout; opdatér status ved login. Ryddes ved hot reload.
hotReloadSubscribe('nyvia.evi-vault', () => {
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') lockVault();
  };
  const hasDocument = vaultAvailable && typeof document !== 'undefined';
  if (hasDocument) document.addEventListener('visibilitychange', onVisibility);

  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (!user) {
      lockVault();
      useEviVaultStore.setState({ status: vaultAvailable ? 'unknown' : 'unavailable' });
    } else {
      void refreshVaultStatus();
    }
  });

  return () => {
    if (hasDocument) document.removeEventListener('visibilitychange', onVisibility);
    unsubAuth();
  };
});
