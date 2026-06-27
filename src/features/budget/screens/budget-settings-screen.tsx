import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { todayISODate } from '@/lib/datetime';
import { View } from '@/tw';
import { BudgetStartForm } from '../components/budget-start-form';
import { SavingsPercentScheduleEditor } from '../components/savings-percent-schedule-editor';
import {
  setBudgetStartDate,
  setSavingsPercent,
  setSavingsPercentChanges,
} from '../data/budget-settings.repository';
import { useBudgetSettingsStore } from '../data/budget-settings-store';

export function BudgetSettingsScreen() {
  const startDate = useBudgetSettingsStore((s) => s.startDate);
  const savingsPercent = useBudgetSettingsStore((s) => s.savingsPercent);
  const savingsPercentChanges = useBudgetSettingsStore((s) => s.savingsPercentChanges);
  const loading = useBudgetSettingsStore((s) => s.loading);

  if (loading) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Budget-indstillinger</AppText>
      <AppText variant="muted">
        Startdatoen er det tidligste tidspunkt en budgetpost kan begynde. Forecasten regnes fra
        denne måned (eller indeværende måned, hvis startdatoen er passeret).
      </AppText>
      <BudgetStartForm
        startDate={startDate ?? todayISODate()}
        savingsPercent={savingsPercent}
        onSubmit={async ({ startDate: date, savingsPercent: pct }) => {
          await setBudgetStartDate(date);
          await setSavingsPercent(pct);
          router.back();
        }}
      />
      <View className="mt-2 border-t border-border pt-4">
        <SavingsPercentScheduleEditor
          changes={savingsPercentChanges}
          onSave={(changes) => setSavingsPercentChanges(changes)}
        />
      </View>
    </Screen>
  );
}
