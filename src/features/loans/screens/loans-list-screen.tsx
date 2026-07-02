import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { LoanCard } from '../components/loan-card';
import { LoansSummary } from '../components/loans-summary';
import { CustomLoanCard } from '../custom/components/custom-loan-card';
import { useLoansStore } from '../data/loans-store';
import { usePendingDeletes } from '../data/pending-deletes';
import { isCustomLoan } from '../types';

export function LoansListScreen() {
  const loans = useLoansStore((s) => s.loans);
  const loading = useLoansStore((s) => s.loading);
  const fromCache = useLoansStore((s) => s.fromCache);
  const pendingIds = usePendingDeletes((s) => s.ids);

  // Skjul lån der er optimistisk slettet (afventer fortryd-vindue).
  const visibleLoans = loans.filter((loan) => !pendingIds.has(loan.id));

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Lån</AppText>
        <Link href="/loans/new" asChild>
          <Button title="Tilføj" className="h-10 px-4" />
        </Link>
      </View>

      <OfflineNotice fromCache={fromCache} />

      {visibleLoans.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen lån endnu"
            description="Tilføj dit første lån for at følge afbetalingen."
          />
        )
      ) : (
        <>
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
        </>
      )}
    </Screen>
  );
}
