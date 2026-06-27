import { SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '../types';

const LABELS: Record<SubscriptionCategory, string> = SUBSCRIPTION_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<SubscriptionCategory, string>
);

export function subscriptionCategoryLabel(category: SubscriptionCategory): string {
  return LABELS[category] ?? category;
}
