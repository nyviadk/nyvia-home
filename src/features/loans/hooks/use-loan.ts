import type { WithId } from '@/lib/firebase';
import { useLoansStore } from '../data/loans-store';
import type { AnyLoan } from '../types';

/** Ét lån udledt fra loans-store (ingen separat listener). */
export function useLoan(id: string): { loan: WithId<AnyLoan> | undefined; loading: boolean } {
  const { item, loading } = useLoansStore.useItem(id);
  return { loan: item, loading };
}
