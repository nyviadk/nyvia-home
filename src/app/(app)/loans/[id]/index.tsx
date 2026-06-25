import { useLocalSearchParams } from 'expo-router';

import { LoanDetailScreen } from '@/features/loans/screens/loan-detail-screen';

export default function LoanDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LoanDetailScreen id={id} />;
}
