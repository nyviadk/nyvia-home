import { router } from 'expo-router';

import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { LoanForm } from '../components/loan-form';
import { createLoan } from '../data/loans.repository';

export function CreateLoanScreen() {
  return (
    <Screen>
      <AppText variant="title">Nyt lån</AppText>
      <LoanForm
        submitLabel="Opret lån"
        onSubmit={async (input) => {
          await createLoan(input);
          router.back();
        }}
      />
    </Screen>
  );
}
