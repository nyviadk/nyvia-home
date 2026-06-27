import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { BudgetEntryForm } from '../components/budget-entry-form';
import { createBudgetEntry } from '../data/budget.repository';
import { useBudgetSettingsStore } from '../data/budget-settings-store';

export function CreateBudgetEntryScreen() {
  // Vent til budget-startdatoen er kendt, så startdato-feltet ikke autofyldes før den.
  const loading = useBudgetSettingsStore((s) => s.loading);

  return (
    <Screen>
      <AppText variant="title">Ny budgetpost</AppText>
      {loading ? (
        <AppText variant="muted">Indlæser…</AppText>
      ) : (
        <BudgetEntryForm
          submitLabel="Opret post"
          onSubmit={async (input) => {
            await createBudgetEntry(input);
            router.back();
          }}
        />
      )}
    </Screen>
  );
}
