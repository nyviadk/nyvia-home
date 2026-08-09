import type { PriceChange } from '@/features/budget/types';
import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import type { Subscription, SubscriptionInput } from '../types';

const repo = createUserCollectionRepo<Subscription, SubscriptionInput>({
  collection: 'subscriptions',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: 'Abonnement oprettet',
});

export const subscribeSubscriptions = repo.subscribe;
export const createSubscription = repo.create;
export const updateSubscription = repo.update;

export const setSubscriptionActive = (id: string, active: boolean) =>
  repo.patch(id, { active }, active ? 'Aktiveret' : 'Sat på pause');

export const updateSubscriptionPriceChanges = (id: string, priceChanges: PriceChange[]) =>
  repo.patch(id, { priceChanges }, 'Prisændring gemt');

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteSubscription = repo.remove;
