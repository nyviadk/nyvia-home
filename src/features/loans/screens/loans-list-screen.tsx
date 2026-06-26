import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AppText } from "@/components/ui/text";
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
  const insets = useSafeAreaInsets();

  // Skjul lån der er optimistisk slettet (afventer fortryd-vindue).
  const visibleLoans = loans.filter((loan) => !pendingIds.has(loan.id));

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlashList
        data={visibleLoans}
        keyExtractor={(item) => item.id}
        style={{ width: '100%', maxWidth: 900, alignSelf: 'center' }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <View className="px-4 pb-3">
            {isCustomLoan(item) ? <CustomLoanCard loan={item} /> : <LoanCard loan={item} />}
          </View>
        )}
        ListHeaderComponent={
          <View className="gap-4 p-4">
            <View className="flex-row items-center justify-between">
              <AppText variant="title">Lån</AppText>
              <Link href="/loans/new" asChild>
                <Button title="Tilføj" className="h-10 px-4" />
              </Link>
            </View>
            {visibleLoans.length > 0 ? <LoansSummary loans={visibleLoans} /> : null}
            {fromCache ? <AppText variant="muted">Offline – viser gemte data</AppText> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="p-4">
              <EmptyState
                title="Ingen lån endnu"
                description="Tilføj dit første lån for at følge afbetalingen."
              />
            </View>
          )
        }
      />
    </View>
  );
}
