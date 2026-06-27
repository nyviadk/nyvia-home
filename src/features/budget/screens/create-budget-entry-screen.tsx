import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { BudgetEntryForm } from '../components/budget-entry-form';
import { createBudgetEntry } from '../data/budget.repository';

export function CreateBudgetEntryScreen() {
  return (
    <Screen>
      <AppText variant="title">Ny budgetpost</AppText>
      <BudgetEntryForm
        submitLabel="Opret post"
        onSubmit={async (input) => {
          await createBudgetEntry(input);
          router.back();
        }}
      />
    </Screen>
  );
}
