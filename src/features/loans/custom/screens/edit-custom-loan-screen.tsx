import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { updateCustomLoan } from '../../data/loans.repository';
import { useLoan } from '../../hooks/use-loan';
import { isCustomLoan } from '../../types';
import { CustomLoanForm } from '../components/custom-loan-form';

export function EditCustomLoanScreen({ id }: { id: string }) {
  const { loan, loading } = useLoan(id);

  if (loading || !loan) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  if (!isCustomLoan(loan)) return null;

  return (
    <Screen>
      <AppText variant="title">Redigér flytte-lån</AppText>
      <CustomLoanForm
        loan={loan}
        submitLabel="Gem ændringer"
        onSubmit={async (input) => {
          await updateCustomLoan(id, input);
          router.back();
        }}
      />
    </Screen>
  );
}
