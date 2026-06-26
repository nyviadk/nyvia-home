import { useLocalSearchParams } from 'expo-router';

import { EditCustomLoanScreen } from '@/features/loans/custom/screens/edit-custom-loan-screen';
import { useLoan } from '@/features/loans/hooks/use-loan';
import { EditLoanScreen } from '@/features/loans/screens/edit-loan-screen';
import { isCustomLoan } from '@/features/loans/types';

export default function EditLoanRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loan } = useLoan(id);
  if (loan && isCustomLoan(loan)) return <EditCustomLoanScreen id={id} />;
  return <EditLoanScreen id={id} />;
}
