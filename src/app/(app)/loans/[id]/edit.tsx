import { useLocalSearchParams } from 'expo-router';

import { EditLoanRoute } from '@/features/loans/screens/loan-routes';

export default function EditLoanRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditLoanRoute id={id} />;
}
