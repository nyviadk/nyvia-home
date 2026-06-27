import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { SubscriptionRow } from '../components/subscription-row';
import { useSubscriptionsStore } from '../data/subscriptions-store';
import { usePendingSubscriptionDeletes } from '../data/pending-deletes';
import { totalMonthlyAverageOre } from '../subscriptions.utils';

export function SubscriptionsHubScreen() {
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const loading = useSubscriptionsStore((s) => s.loading);
  const fromCache = useSubscriptionsStore((s) => s.fromCache);
  const pendingIds = usePendingSubscriptionDeletes((s) => s.ids);

  const visible = subscriptions
    .filter((s) => !pendingIds.has(s.id))
    .sort((a, b) => b.amount - a.amount);
  const totalMonthly = totalMonthlyAverageOre(visible);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Abonnementer</AppText>
        <Link href="/subscriptions/new" asChild>
          <Button title="Tilføj" className="h-10 px-4" />
        </Link>
      </View>

      {fromCache ? <AppText variant="muted">Offline – viser gemte data</AppText> : null}

      {visible.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen abonnementer endnu"
            description="Tilføj forsikringer, streaming og kontingenter, så de regnes med i budgettet."
          />
        )
      ) : (
        <>
          <Card className="border-0 bg-accent-budget">
            <AppText className="text-on-primary/80">Gennemsnit / md. (aktive)</AppText>
            <MoneyText ore={totalMonthly} whole className="text-3xl font-bold text-on-primary" />
          </Card>

          <View className="gap-2">
            {visible.map((subscription) => (
              <SubscriptionRow key={subscription.id} subscription={subscription} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
