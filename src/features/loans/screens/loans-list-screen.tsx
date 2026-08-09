import { ListGate } from '@/components/ui/list-gate';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { View } from '@/tw';
import { LoanCard } from '../components/loan-card';
import { LoansSummary } from '../components/loans-summary';
import { CustomLoanCard } from '../custom/components/custom-loan-card';
import { useLoansStore } from '../data/loans-store';
import { withoutPending } from '@/lib/db/pending-deletes';
import { isCustomLoan } from '../types';

export function LoansListScreen() {
  const loans = useLoansStore.useVisibleItems();
  const loading = useLoansStore((s) => s.loading);
  const fromCache = useLoansStore((s) => s.fromCache);
  const pendingIds = useLoansStore.pending.useStore((s) => s.ids);

  // Skjul lån der er optimistisk slettet (afventer fortryd-vindue).
  const visibleLoans = withoutPending(loans, pendingIds);

  return (
    <Screen>
      <ScreenHeader title="Lån" addHref="/loans/new" />
      <OfflineNotice fromCache={fromCache} />

      <ListGate
        count={visibleLoans.length}
        loading={loading}
        empty={{
          title: 'Ingen lån endnu',
          description: 'Tilføj dit første lån for at følge afbetalingen.',
        }}>
        <LoansSummary loans={visibleLoans} />
        <View className="gap-3">
          {visibleLoans.map((loan) =>
            isCustomLoan(loan) ? (
              <CustomLoanCard key={loan.id} loan={loan} />
            ) : (
              <LoanCard key={loan.id} loan={loan} />
            )
          )}
        </View>
      </ListGate>
    </Screen>
  );
}
