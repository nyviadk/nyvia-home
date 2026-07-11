import { useLocalSearchParams } from 'expo-router';

import { EviCustomerDetailScreen } from '@/features/evi/screens/customer-detail-screen';

export default function EviCustomerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EviCustomerDetailScreen id={id} />;
}
