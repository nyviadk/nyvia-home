import { router } from 'expo-router';

import { AppText, Screen } from '@/components/ui';
import { LoanForm } from '../components/loan-form';
import { updateLoan } from '../data/loans.repository';
import { useLoanDetail } from '../hooks/use-loan-detail';

export function EditLoanScreen({ id }: { id: string }) {
  const { loan, loading } = useLoanDetail(id);

  if (loading || !loan) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Redigér lån</AppText>
      <LoanForm
        loan={loan}
        submitLabel="Gem ændringer"
        onSubmit={async (input) => {
          await updateLoan(id, input);
          router.back();
        }}
      />
    </Screen>
  );
}
