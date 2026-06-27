import { Link } from "expo-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import type { WithId } from "@/lib/firebase";
import { View } from "@/tw";
import { BudgetEntryRow } from "../components/budget-entry-row";
import { ForecastSummary } from "../components/forecast-summary";
import { LoanBudgetCard } from "../components/loan-budget-card";
import { useBudgetStore } from "../data/budget-store";
import { usePendingBudgetDeletes } from "../data/pending-deletes";
import type { BudgetEntry } from "../types";

function Section({
  title,
  entries,
}: {
  title: string;
  entries: WithId<BudgetEntry>[];
}) {
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
  const byAmountDesc = (a: WithId<BudgetEntry>, b: WithId<BudgetEntry>) =>
    b.amount - a.amount;
  const incomes = visible.filter((e) => e.type === "income").sort(byAmountDesc);
  const expenses = visible
    .filter((e) => e.type === "expense")
    .sort(byAmountDesc);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Budget</AppText>
        <View className="flex-row items-center gap-2">
          <Link href="/budget/settings" asChild>
            <Button
              title="Indstillinger"
              variant="secondary"
              className="h-10 px-4"
            />
          </Link>
          <Link href="/budget/new" asChild>
            <Button title="Tilføj" className="h-10 px-4" />
          </Link>
        </View>
      </View>

      {fromCache ? (
        <AppText variant="muted">Offline – viser gemte data</AppText>
      ) : null}

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
          <LoanBudgetCard />
          <Section title="Indtægter" entries={incomes} />
          <Section title="Udgifter" entries={expenses} />
        </>
      )}
    </Screen>
  );
}
