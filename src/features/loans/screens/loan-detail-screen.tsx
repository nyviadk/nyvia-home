import { Link } from 'expo-router';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { MoneyText } from "@/components/ui/money-text";
import { StatRow } from '@/components/ui/stat-row';
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { LoanProgressBlock } from '../components/loan-progress-block';
import { PaymentForm } from '../components/payment-form';
import { PaymentRow } from '../components/payment-row';
import { useLoansStore } from '../data/loans-store';
import { addPayment, deleteLoan } from '../data/loans.repository';
import { loanProgress, progressPercent } from '../loans.utils';
import type { Loan } from '../types';

export function LoanDetailScreen({ loan }: { loan: WithId<Loan> }) {
  const id = loan.id;
  const progress = loanProgress(loan);
  const payments = [...(loan.payments ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <AppText variant="title">{loan.name}</AppText>
          <AppText variant="muted">{loan.lender}</AppText>
        </View>
        <Link href={{ pathname: '/loans/[id]/edit', params: { id } }} asChild>
          <Button title="Redigér" variant="secondary" className="h-10 px-4" />
        </Link>
      </View>

      <Card className="gap-3">
        <LoanProgressBlock
          currentOre={loan.currentBalance}
          originalOre={loan.originalAmount}
          progress={progress}
          footerLeft={`${progressPercent(loan)}% afdraget`}
          footerRight={null}
        />

        <View className="mt-2 gap-1">
          <StatRow label="Rente">{`${loan.interestRate}% p.a.`}</StatRow>
          <StatRow label="Ydelse / md.">
            <MoneyText ore={loan.monthlyPayment} whole variant="label" />
          </StatRow>
          <StatRow label="Startdato">{formatDateCopenhagen(loan.startDate)}</StatRow>
        </View>
      </Card>

      <View className="gap-3">
        <AppText variant="heading">Registrér afdrag</AppText>
        <PaymentForm
          onSubmit={(input) => addPayment(id, loan.currentBalance, loan.payments ?? [], input)}
        />
      </View>

      <View className="gap-1">
        <AppText variant="heading">Afdrag</AppText>
        {payments.length === 0 ? (
          <AppText variant="muted">Ingen afdrag registreret endnu.</AppText>
        ) : (
          payments.map((p) => <PaymentRow key={p.id} payment={p} />)
        )}
      </View>

      <DeleteEntityLink
        id={id}
        label="Slet lån"
        name={loan.name}
        pending={useLoansStore.pending}
        remove={() => deleteLoan(id)}
      />
    </Screen>
  );
}
