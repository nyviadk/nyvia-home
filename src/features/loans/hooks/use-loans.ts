import { useEffect, useState } from 'react';

import type { WithId } from '@/lib/firebase';
import { subscribeLoans } from '../data/loans.repository';
import type { Loan } from '../types';

export interface LoansState {
  loans: WithId<Loan>[];
  loading: boolean;
  fromCache: boolean;
  error: string | null;
}

/** Realtime-abonnement på alle lån (opdaterer fra cache når offline). */
export function useLoans(): LoansState {
  const [state, setState] = useState<LoansState>({
    loans: [],
    loading: true,
    fromCache: false,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeLoans(
      (snap) =>
        setState({ loans: snap.docs, loading: false, fromCache: snap.fromCache, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error: error.message }))
    );
    return unsubscribe;
  }, []);

  return state;
}
