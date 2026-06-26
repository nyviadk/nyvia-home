import { useSyncExternalStore } from 'react';

import type { WithId } from '@/lib/firebase';
import { getPaymentsSnapshot, subscribeToPayments } from '../data/payments-subscription';
import type { Payment } from '../types';

/**
 * Afdrags-log for ét lån via useSyncExternalStore (Reacts hook til eksterne stores)
 * — ingen useEffect/useState. Listeneren tilknyttes/frigøres med komponentens livscyklus.
 */
export function usePayments(loanId: string): WithId<Payment>[] {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToPayments(loanId, onStoreChange),
    () => getPaymentsSnapshot(loanId),
    () => getPaymentsSnapshot(loanId)
  );
}
