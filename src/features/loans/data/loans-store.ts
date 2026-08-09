import { createCollectionStore } from '@/lib/db/collection-store';
import type { AnyLoan } from '../types';
import { subscribeLoans } from './loans.repository';

export const useLoansStore = createCollectionStore<AnyLoan>(
  'nyvia.loans',
  subscribeLoans,
  'loans'
);
