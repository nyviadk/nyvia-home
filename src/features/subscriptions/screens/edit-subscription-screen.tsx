import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { DeleteSubscriptionLink } from '../components/delete-subscription-link';
import { SubscriptionForm } from '../components/subscription-form';
import { updateSubscription } from '../data/subscriptions.repository';
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
      <DeleteSubscriptionLink id={id} name={subscription.name} />
    </Screen>
  );
}
