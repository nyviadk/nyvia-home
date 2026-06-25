import { useEffect, useState } from 'react';

import type { WithId } from '@/lib/firebase';
import { subscribeLoan, subscribePayments } from '../data/loans.repository';
import type { Loan, Payment } from '../types';

export interface LoanDetailState {
  loan: WithId<Loan> | null;
  payments: WithId<Payment>[];
  loading: boolean;
  error: string | null;
}

/** Realtime-abonnement på ét lån + dets afdrags-log. */
export function useLoanDetail(id: string): LoanDetailState {
  const [loan, setLoan] = useState<WithId<Loan> | null>(null);
  const [payments, setPayments] = useState<WithId<Payment>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubLoan = subscribeLoan(
      id,
      (next) => {
        setLoan(next);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
    const unsubPayments = subscribePayments(
      id,
      (snap) => setPayments(snap.docs),
      (e) => setError(e.message)
    );
    return () => {
      unsubLoan();
      unsubPayments();
    };
  }, [id]);

  return { loan, payments, loading, error };
}
