import { create } from 'zustand';

import { refreshVaultStatus, useEviVaultStore } from '../crypto/vault-store';

/**
 * Lille controller til ÉN boks-modal (opsætning/lås-op). `requestVaultAccess()` sikrer at
 * boksen er åben og resolver true; annullerer brugeren → false. Så en følsom handling kan
 * skrive `if (!(await requestVaultAccess())) return;`.
 */
interface GateState {
  open: boolean;
  resolver: ((ok: boolean) => void) | null;
}

export const useVaultGate = create<GateState>(() => ({ open: false, resolver: null }));

export async function requestVaultAccess(): Promise<boolean> {
  let status = useEviVaultStore.getState().status;
  // Sørg for at vi ved om boksen findes (locked) eller skal oprettes (absent), så modalen
  // viser den rigtige tilstand og ikke fejler et "lås op" mod en boks der ikke findes endnu.
  if (status === 'unknown') {
    await refreshVaultStatus();
    status = useEviVaultStore.getState().status;
  }
  if (status === 'unlocked') return true;
  if (status === 'unavailable') return false;
  return new Promise<boolean>((resolve) => {
    useVaultGate.setState({ open: true, resolver: resolve });
  });
}

export function resolveVaultGate(ok: boolean): void {
  const { resolver } = useVaultGate.getState();
  resolver?.(ok);
  useVaultGate.setState({ open: false, resolver: null });
}
