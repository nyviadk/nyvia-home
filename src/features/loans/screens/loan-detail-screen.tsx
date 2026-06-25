import { Link, router } from 'expo-router';

import { AppText, Button, Card, EmptyState, MoneyText, ProgressBar, Screen } from '@/components/ui';
import { formatDateCopenhagen } from '@/lib/datetime';
import { confirmAction } from '@/lib/confirm';
import { View } from '@/tw';
import { PaymentForm } from '../components/payment-form';
import { PaymentRow } from '../components/payment-row';
import { addPayment, deleteLoan } from '../data/loans.repository';
import { useLoanDetail } from '../hooks/use-loan-detail';
import { loanProgress } from '../loans.utils';

export function LoanDetailScreen({ id }: { id: string }) {
  const { loan, payments, loading } = useLoanDetail(id);

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

  const progress = loanProgress(loan);

  async function handleDelete() {
    const ok = await confirmAction('Slet lån', `Vil du slette "${loan!.name}"?`, 'Slet');
    if (!ok) return;
    await deleteLoan(id);
    router.back();
  }

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
        <AppText variant="muted">{Math.round(progress * 100)}% afdraget</AppText>

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

      <Button title="Slet lån" variant="ghost" onPress={handleDelete} className="mt-2" />
    </Screen>
  );
}
