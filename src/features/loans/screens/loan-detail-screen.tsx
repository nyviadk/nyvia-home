import { Link } from 'expo-router';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyText } from "@/components/ui/money-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { formatDateCopenhagen } from '@/lib/datetime';
import { View } from '@/tw';
import { DeleteLoanLink } from '../components/delete-loan-link';
import { PaymentForm } from '../components/payment-form';
import { PaymentRow } from '../components/payment-row';
import { addPayment } from '../data/loans.repository';
import { useLoan } from '../hooks/use-loan';
import { usePayments } from '../hooks/use-payments';
import { loanProgress, progressPercent } from '../loans.utils';
import { isCustomLoan } from '../types';

export function LoanDetailScreen({ id }: { id: string }) {
  const { loan, loading } = useLoan(id);
  const payments = usePayments(id);

  if (loading && !loan) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  if (!loan) {
    return (
      <Screen>
        <EmptyState title="Lånet findes ikke" description="Det er muligvis blevet slettet." />
      </Screen>
    );
  }

  // Custom-lån håndteres af CustomLoanDetailScreen (ruten brancher).
  if (isCustomLoan(loan)) return null;

  const progress = loanProgress(loan);

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
        <View className="flex-row items-baseline justify-between">
          <MoneyText ore={loan.currentBalance} whole variant="heading" />
          <View className="flex-row items-baseline gap-1">
            <AppText variant="muted">af</AppText>
            <MoneyText ore={loan.originalAmount} whole variant="muted" />
          </View>
        </View>
        <ProgressBar value={progress} />
        <AppText variant="muted">{progressPercent(loan)}% afdraget</AppText>

        <View className="mt-2 flex-row justify-between">
          <AppText variant="muted">Rente</AppText>
          <AppText variant="label">{loan.interestRate}% p.a.</AppText>
        </View>
        <View className="flex-row justify-between">
          <AppText variant="muted">Ydelse / md.</AppText>
          <MoneyText ore={loan.monthlyPayment} whole variant="label" />
        </View>
        <View className="flex-row justify-between">
          <AppText variant="muted">Startdato</AppText>
          <AppText variant="label">{formatDateCopenhagen(loan.startDate)}</AppText>
        </View>
      </Card>

      <View className="gap-3">
        <AppText variant="heading">Registrér afdrag</AppText>
        <PaymentForm
          onSubmit={(input) => addPayment(id, loan.currentBalance, input)}
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

      <DeleteLoanLink id={id} name={loan.name} />
    </Screen>
  );
}
