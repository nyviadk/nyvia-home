import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { DeleteLoanLink } from '../../components/delete-loan-link';
import { useLoan } from '../../hooks/use-loan';
import { isCustomLoan } from '../../types';
import { BufferControl } from '../components/buffer-control';
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
      {loan.horizon === 'asap' ? <BufferControl loan={loan} /> : null}
      <ScheduleActuals loan={loan} />

      <DeleteLoanLink id={id} name={loan.name || 'Flytte-lån'} />
    </Screen>
  );
}
