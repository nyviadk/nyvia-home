import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { updateCustomLoan } from '../../data/loans.repository';
import { CustomLoanForm } from '../components/custom-loan-form';
import type { CustomLoan } from '../types';

export function EditCustomLoanScreen({ loan }: { loan: WithId<CustomLoan> }) {
  const id = loan.id;
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
