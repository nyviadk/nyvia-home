import { Link, router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { View } from '@/tw';
import { deleteLoan } from '../../data/loans.repository';
import { useLoan } from '../../hooks/use-loan';
import { isCustomLoan } from '../../types';
import { CustomSummary } from '../components/custom-summary';
import { EditableExpenseTable } from '../components/editable-expense-table';
import { EditableLineItems } from '../components/editable-line-items';
import { HorizonSelect } from '../components/horizon-select';
import { ScheduleActuals } from '../components/schedule-actuals';

export function CustomLoanDetailScreen({ id }: { id: string }) {
  const { loan, loading } = useLoan(id);

  if (loading && !loan) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  if (!loan || !isCustomLoan(loan)) {
    return (
      <Screen>
        <EmptyState title="Lånet findes ikke" description="Det er muligvis blevet slettet." />
      </Screen>
    );
  }

  const loanName = loan.name || 'Flytte-lån';
  async function handleDelete() {
    const ok = await confirmAction('Slet lån', `Vil du slette "${loanName}"?`, 'Slet');
    if (!ok) return;
    await deleteLoan(id);
    router.back();
  }

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <AppText variant="title">{loan.name || 'Flytte-lån'}</AppText>
          <AppText variant="muted">Flytte-lån</AppText>
        </View>
        <Link href={{ pathname: '/loans/[id]/edit', params: { id } }} asChild>
          <Button title="Redigér" variant="secondary" className="h-10 px-4" />
        </Link>
      </View>

      <CustomSummary loan={loan} />
      <EditableLineItems loan={loan} />
      <EditableExpenseTable loan={loan} tableKey="newHome" defaultTitle="Ny bolig" />
      <EditableExpenseTable loan={loan} tableKey="oldHome" defaultTitle="Nuværende bolig" />

      <AppText variant="heading">Afbetalingsplan</AppText>
      <HorizonSelect loan={loan} />
      <ScheduleActuals loan={loan} />

      <Button title="Slet lån" variant="ghost" onPress={handleDelete} className="mt-2" />
    </Screen>
  );
}
