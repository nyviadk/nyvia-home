import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { todayISODate } from '@/lib/datetime';
import { BudgetStartForm } from '../components/budget-start-form';
import { setBudgetStartDate } from '../data/budget-settings.repository';
import { useBudgetSettingsStore } from '../data/budget-settings-store';

export function BudgetSettingsScreen() {
  const startDate = useBudgetSettingsStore((s) => s.startDate);
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
        onSubmit={async (date) => {
          await setBudgetStartDate(date);
          router.back();
        }}
      />
    </Screen>
  );
}
