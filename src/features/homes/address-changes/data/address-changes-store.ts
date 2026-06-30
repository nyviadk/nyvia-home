import { createCollectionStore } from '@/lib/db/collection-store';
import type { AddressChange } from '../types';
import { subscribeAddressChanges } from './address-changes.repository';

export const useAddressChangesStore = createCollectionStore<AddressChange>(
  'nyvia.address-changes',
  subscribeAddressChanges
);
