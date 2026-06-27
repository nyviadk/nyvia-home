import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { recurrenceLabel } from '@/lib/recurrence/label';
import { cn } from '@/lib/cn';
import { Pressable, Switch, View } from '@/tw';
import { setSubscriptionActive } from '../data/subscriptions.repository';
import { subscriptionCategoryLabel } from '../data/category-label';
import type { Subscription } from '../types';

export function SubscriptionRow({ subscription }: { subscription: WithId<Subscription> }) {
  return (
    <Card className={cn('flex-row items-center gap-3', !subscription.active && 'opacity-50')}>
      <Link
        href={{ pathname: '/subscriptions/[id]', params: { id: subscription.id } }}
        asChild>
        <Pressable accessibilityRole="button" className="flex-1 flex-row items-center gap-3">
          <View className="flex-1">
            <AppText variant="label">{subscription.name}</AppText>
            <AppText variant="muted">
              {subscriptionCategoryLabel(subscription.category)} ·{' '}
              {recurrenceLabel(subscription.recurrence)}
            </AppText>
          </View>
          <MoneyText ore={subscription.amount} whole variant="label" />
        </Pressable>
      </Link>
      <Switch
        value={subscription.active}
        onValueChange={(active) => setSubscriptionActive(subscription.id, active)}
      />
    </Card>
  );
}
