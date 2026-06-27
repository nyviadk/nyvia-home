import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AppText } from '@/components/ui/text';
import { Screen } from '@/components/ui/screen';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { BudgetEntryRow } from '../components/budget-entry-row';
import { ForecastSummary } from '../components/forecast-summary';
import { useBudgetStore } from '../data/budget-store';
import { usePendingBudgetDeletes } from '../data/pending-deletes';
import type { BudgetEntry } from '../types';

function Section({ title, entries }: { title: string; entries: WithId<BudgetEntry>[] }) {
  return (
    <View className="gap-2">
      <AppText variant="heading">{title}</AppText>
      {entries.length > 0 ? (
        entries.map((entry) => <BudgetEntryRow key={entry.id} entry={entry} />)
      ) : (
        <AppText variant="muted">Ingen endnu.</AppText>
      )}
    </View>
  );
}

export function BudgetScreen() {
  const entries = useBudgetStore((s) => s.entries);
  const loading = useBudgetStore((s) => s.loading);
  const fromCache = useBudgetStore((s) => s.fromCache);
  const pendingIds = usePendingBudgetDeletes((s) => s.ids);

  const visible = entries.filter((e) => !pendingIds.has(e.id));
  const incomes = visible.filter((e) => e.type === 'income');
  const expenses = visible.filter((e) => e.type === 'expense');

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Budget</AppText>
        <Link href="/budget/new" asChild>
          <Button title="Tilføj" className="h-10 px-4" />
        </Link>
      </View>

      {fromCache ? <AppText variant="muted">Offline – viser gemte data</AppText> : null}

      {visible.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen budgetposter endnu"
            description="Tilføj faste indtægter og udgifter for at se dit forventede rådighedsbeløb."
          />
        )
      ) : (
        <>
          <ForecastSummary />
          <Section title="Indtægter" entries={incomes} />
          <Section title="Udgifter" entries={expenses} />
        </>
      )}
    </Screen>
  );
}
