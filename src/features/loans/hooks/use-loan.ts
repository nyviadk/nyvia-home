import type { WithId } from '@/lib/firebase';
import { useLoansStore } from '../data/loans-store';
import type { AnyLoan } from '../types';

/** Ét lån udledt fra loans-store (ingen separat listener). */
export function useLoan(id: string): { loan: WithId<AnyLoan> | undefined; loading: boolean } {
  const loan = useLoansStore((s) => s.loans.find((l) => l.id === id));
  const loading = useLoansStore((s) => s.loading);
  return { loan, loading };
}
