import { createCollectionStore } from '@/lib/db/collection-store';
import type { BankTransaction } from '../types';
import { subscribeTransactions } from './transactions.repository';

// Persisteret som de øvrige data-stores → forbrug males synkront ved kold start (mærkbart
// hurtigere på mobil). Skrive-amplifikationen (persist re-serialiserer hele samlingen ved
// hver ændring) er ufarlig her: CSV-bulkimport er WEB-only, og på native ændres samlingen
// kun via Firestore-sync (sjældne emits). Bliver `forbrug` engang enormt (100k+), er svaret
// paginering af Firestore-queryen — ikke at fjerne persistensen. Se [[mmkv-persistence]].
export const useTransactionsStore = createCollectionStore<BankTransaction>(
  'nyvia.transactions',
  subscribeTransactions,
  'transactions'
);
