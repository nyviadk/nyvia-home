import { router } from 'expo-router';

import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import type { WithId } from '@/lib/firebase';
import { LoanForm } from '../components/loan-form';
import { updateLoan } from '../data/loans.repository';
import type { Loan } from '../types';

export function EditLoanScreen({ loan }: { loan: WithId<Loan> }) {
  const id = loan.id;
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
