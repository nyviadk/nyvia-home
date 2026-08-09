import { useLocalSearchParams } from 'expo-router';

import { LoanDetailRoute } from '@/features/loans/screens/loan-routes';

export default function LoanDetailRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LoanDetailRoute id={id} />;
}
