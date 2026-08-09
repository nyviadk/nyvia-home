import { router } from 'expo-router';

import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { PriceChangeEditor } from '@/features/budget/components/price-change-editor';
import { View } from '@/tw';
import { SubscriptionForm } from '../components/subscription-form';
import { useSubscriptionsStore } from '../data/subscriptions-store';
import {
  deleteSubscription,
  updateSubscription,
  updateSubscriptionPriceChanges,
} from '../data/subscriptions.repository';
import { useSubscription } from '../hooks/use-subscription';

export function EditSubscriptionScreen({ id }: { id: string }) {
  const { subscription, loading } = useSubscription(id);

  if (loading || !subscription) return <LoadingScreen />;

  return (
    <Screen>
      <AppText variant="title">Redigér abonnement</AppText>
      <SubscriptionForm
        subscription={subscription}
        submitLabel="Gem ændringer"
        onSubmit={async (input) => {
          await updateSubscription(id, input);
          router.back();
        }}
      />
      <View className="mt-2 border-t border-border pt-4">
        <PriceChangeEditor
          changes={subscription.priceChanges ?? []}
          onSave={(changes) => updateSubscriptionPriceChanges(id, changes)}
        />
      </View>
      <DeleteEntityLink
        id={id}
        label="Slet abonnement"
        name={subscription.name}
        pending={useSubscriptionsStore.pending}
        remove={() => deleteSubscription(id)}
      />
    </Screen>
  );
}
