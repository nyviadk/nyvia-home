import { useLocalSearchParams } from 'expo-router';

import { EditLoanScreen } from '@/features/loans/screens/edit-loan-screen';

export default function EditLoanRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditLoanScreen id={id} />;
}
