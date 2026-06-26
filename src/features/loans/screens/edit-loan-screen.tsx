import { router } from 'expo-router';

import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { LoanForm } from '../components/loan-form';
import { updateLoan } from '../data/loans.repository';
import { useLoan } from '../hooks/use-loan';
import { isCustomLoan } from '../types';

export function EditLoanScreen({ id }: { id: string }) {
  const { loan, loading } = useLoan(id);

  if (loading || !loan) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  // Custom-lån redigeres af CustomLoanFormScreen (ruten brancher).
  if (isCustomLoan(loan)) return null;

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
