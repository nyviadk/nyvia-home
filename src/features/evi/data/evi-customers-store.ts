import { createCollectionStore } from '@/lib/db/collection-store';
import type { EviCustomer } from '../types';
import { subscribeEviCustomers } from './evi-customers.repository';

/** Kunde-submissions. Ciffertekst i følsomme felter er ok at cache (den er krypteret). */
export const useEviCustomersStore = createCollectionStore<EviCustomer>(
  'evi-customers',
  subscribeEviCustomers,
);
