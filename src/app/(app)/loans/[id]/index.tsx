import { useLocalSearchParams } from 'expo-router';

import { CustomLoanDetailScreen } from '@/features/loans/custom/screens/custom-loan-detail-screen';
import { useLoan } from '@/features/loans/hooks/use-loan';
import { LoanDetailScreen } from '@/features/loans/screens/loan-detail-screen';
import { isCustomLoan } from '@/features/loans/types';

export default function LoanDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loan } = useLoan(id);
  if (loan && isCustomLoan(loan)) return <CustomLoanDetailScreen id={id} />;
  return <LoanDetailScreen id={id} />;
}
