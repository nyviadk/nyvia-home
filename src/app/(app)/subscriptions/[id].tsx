import { useLocalSearchParams } from 'expo-router';

import { EditSubscriptionScreen } from '@/features/subscriptions/screens/edit-subscription-screen';

export default function SubscriptionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditSubscriptionScreen id={id} />;
}
