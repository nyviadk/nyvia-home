import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { PriceChangeEditor } from '@/features/budget/components/price-change-editor';
import { View } from '@/tw';
import { DeleteSubscriptionLink } from '../components/delete-subscription-link';
import { SubscriptionForm } from '../components/subscription-form';
import { updateSubscription, updateSubscriptionPriceChanges } from '../data/subscriptions.repository';
import { useSubscription } from '../hooks/use-subscription';

export function EditSubscriptionScreen({ id }: { id: string }) {
  const { subscription, loading } = useSubscription(id);

  if (loading || !subscription) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

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
      <DeleteSubscriptionLink id={id} name={subscription.name} />
    </Screen>
  );
}
