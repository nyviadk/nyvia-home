import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { SubscriptionForm } from '../components/subscription-form';
import { createSubscription } from '../data/subscriptions.repository';

export function CreateSubscriptionScreen() {
  return (
    <Screen>
      <AppText variant="title">Nyt abonnement</AppText>
      <SubscriptionForm
        submitLabel="Opret abonnement"
        onSubmit={async (input) => {
          await createSubscription(input);
          router.back();
        }}
      />
    </Screen>
  );
}
