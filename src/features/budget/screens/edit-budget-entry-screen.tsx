import { router } from 'expo-router';

import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { BudgetEntryForm } from '../components/budget-entry-form';
import { useBudgetStore } from '../data/budget-store';
import { PriceChangeEditor } from '../components/price-change-editor';
import { updateBudgetEntry, updateBudgetPriceChanges, deleteBudgetEntry } from '../data/budget.repository';
import { useBudgetEntry } from '../hooks/use-budget-entry';

export function EditBudgetEntryScreen({ id }: { id: string }) {
  const { entry, loading } = useBudgetEntry(id);

  if (loading || !entry) return <LoadingScreen />;

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
      <View className="mt-2 border-t border-border pt-4">
        <PriceChangeEditor
          changes={entry.priceChanges ?? []}
          onSave={(changes) => updateBudgetPriceChanges(id, changes)}
        />
      </View>
      <DeleteEntityLink
        id={id}
        label="Slet post"
        name={entry.name}
        pending={useBudgetStore.pending}
        remove={() => deleteBudgetEntry(id)}
      />
    </Screen>
  );
}
