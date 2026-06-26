import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AppText } from "@/components/ui/text";
import { View } from '@/tw';
import { LoanCard } from '../components/loan-card';
import { LoansSummary } from '../components/loans-summary';
import { useLoansStore } from '../data/loans-store';

export function LoansListScreen() {
  const loans = useLoansStore((s) => s.loans);
  const loading = useLoansStore((s) => s.loading);
  const fromCache = useLoansStore((s) => s.fromCache);
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlashList
        data={loans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <View className="px-4 pb-3">
            <LoanCard loan={item} />
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
            {loans.length > 0 ? <LoansSummary loans={loans} /> : null}
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
