import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { useLoansStore } from '../../data/loans-store';
import { deleteLoan } from '../../data/loans.repository';
import type { CustomLoan } from '../types';
import { BufferControl } from '../components/buffer-control';
import { CustomSummary } from '../components/custom-summary';
import { EditableExpenseTable } from '../components/editable-expense-table';
import { EditableLineItems } from '../components/editable-line-items';
import { HorizonSelect } from '../components/horizon-select';
import { PayeeCard } from '../components/payee-card';
import { ScheduleActuals } from '../components/schedule-actuals';

export function CustomLoanDetailScreen({ loan }: { loan: WithId<CustomLoan> }) {
  const id = loan.id;
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
      <PayeeCard payee={loan.payee} />
      <EditableLineItems loan={loan} />
      <EditableExpenseTable loan={loan} tableKey="newHome" defaultTitle="Ny bolig" />
      <EditableExpenseTable loan={loan} tableKey="oldHome" defaultTitle="Nuværende bolig" />

      <AppText variant="heading">Afbetalingsplan</AppText>
      <HorizonSelect loan={loan} />
      {loan.horizon === 'asap' ? <BufferControl loan={loan} /> : null}
      <ScheduleActuals loan={loan} />

      <DeleteEntityLink
        id={id}
        label="Slet lån"
        name={loan.name || 'Flytte-lån'}
        pending={useLoansStore.pending}
        remove={() => deleteLoan(id)}
      />
    </Screen>
  );
}
