import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useBudgetSettingsStore } from '@/features/budget/data/budget-settings-store';
import { SubscriptionForm } from '../components/subscription-form';
import { createSubscription } from '../data/subscriptions.repository';

export function CreateSubscriptionScreen() {
  const loading = useBudgetSettingsStore((s) => s.loading);

  return (
    <Screen>
      <AppText variant="title">Nyt abonnement</AppText>
      {loading ? (
        <AppText variant="muted">Indlæser…</AppText>
      ) : (
        <SubscriptionForm
          submitLabel="Opret abonnement"
          onSubmit={async (input) => {
            await createSubscription(input);
            router.back();
          }}
        />
      )}
    </Screen>
  );
}
