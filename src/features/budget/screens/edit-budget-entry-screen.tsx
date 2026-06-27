import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { BudgetEntryForm } from '../components/budget-entry-form';
import { DeleteBudgetLink } from '../components/delete-budget-link';
import { updateBudgetEntry } from '../data/budget.repository';
import { useBudgetEntry } from '../hooks/use-budget-entry';

export function EditBudgetEntryScreen({ id }: { id: string }) {
  const { entry, loading } = useBudgetEntry(id);

  if (loading || !entry) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Redigér post</AppText>
      <BudgetEntryForm
        entry={entry}
        submitLabel="Gem ændringer"
        onSubmit={async (input) => {
          await updateBudgetEntry(id, input);
          router.back();
        }}
      />
      <DeleteBudgetLink id={id} name={entry.name} />
    </Screen>
  );
}
