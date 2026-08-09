import { Card } from '@/components/ui/card';
import { ListGate } from '@/components/ui/list-gate';
import { MoneyText } from '@/components/ui/money-text';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { SubscriptionRow } from '../components/subscription-row';
import { useSubscriptionsStore } from '../data/subscriptions-store';
import { totalMonthlyAverageOre } from '../subscriptions.utils';

export function SubscriptionsHubScreen() {
  const subscriptions = useSubscriptionsStore.useVisibleItems();
  const loading = useSubscriptionsStore((s) => s.loading);
  const fromCache = useSubscriptionsStore((s) => s.fromCache);

  // Kopi FØR sort: useVisibleItems kan give storens egen array-reference tilbage, og
  // Array.sort muterer på stedet.
  const visible = [...subscriptions].sort((a, b) => b.amount - a.amount);
  const totalMonthly = totalMonthlyAverageOre(visible);

  return (
    <Screen>
      <ScreenHeader title="Abonnementer" addHref="/subscriptions/new" />
      <OfflineNotice fromCache={fromCache} />

      <ListGate
        count={visible.length}
        loading={loading}
        empty={{
          title: 'Ingen abonnementer endnu',
          description:
            'Tilføj forsikringer, streaming og kontingenter, så de regnes med i budgettet.',
        }}>
        <Card className="border-0 bg-accent-budget">
          <AppText className="text-on-primary/80">Gennemsnit / md. (aktive)</AppText>
          <MoneyText ore={totalMonthly} whole className="text-3xl font-bold text-on-primary" />
        </Card>

        <View className="gap-2">
          {visible.map((subscription) => (
            <SubscriptionRow key={subscription.id} subscription={subscription} />
          ))}
        </View>
      </ListGate>
    </Screen>
  );
}
