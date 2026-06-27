import type { Recurrence } from '@/lib/recurrence/types';

export type SubscriptionCategory =
  | 'forsikring'
  | 'internet'
  | 'mobil'
  | 'streaming'
  | 'kontingent'
  | 'andet';

/** Et fast abonnement/forsikring (altid en udgift). Beløb i øre, positivt. */
export type Subscription = {
  name: string;
  amount: number;
  category: SubscriptionCategory;
  recurrence: Recurrence;
  active: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionInput = Pick<
  Subscription,
  'name' | 'amount' | 'category' | 'recurrence' | 'active' | 'note'
>;

export const SUBSCRIPTION_CATEGORIES: { value: SubscriptionCategory; label: string }[] = [
  { value: 'forsikring', label: 'Forsikring' },
  { value: 'internet', label: 'Internet' },
  { value: 'mobil', label: 'Mobil' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'kontingent', label: 'Kontingent' },
  { value: 'andet', label: 'Andet' },
];
