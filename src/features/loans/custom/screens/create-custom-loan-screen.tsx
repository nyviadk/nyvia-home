import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { createCustomLoan } from '../../data/loans.repository';
import { CustomLoanForm } from '../components/custom-loan-form';

export function CreateCustomLoanScreen() {
  return (
    <Screen>
      <AppText variant="title">Nyt flytte-lån</AppText>
      <CustomLoanForm
        submitLabel="Opret lån"
        onSubmit={async (input) => {
          await createCustomLoan(input);
          router.back();
        }}
      />
    </Screen>
  );
}
