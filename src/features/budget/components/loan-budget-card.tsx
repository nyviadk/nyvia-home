import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { useLoansStore } from '@/features/loans/data/loans-store';
import { totalBalance, totalMonthlyPayment } from '@/features/loans/loans.utils';
import { Pressable, View } from '@/tw';

/** Read-only lån-overblik på budget-siden (afbetalingsplan ligger i Lån-fanen). */
export function LoanBudgetCard() {
  const loans = useLoansStore((s) => s.loans);
  if (loans.length === 0) return null;

  const monthly = totalMonthlyPayment(loans);
  const remaining = totalBalance(loans);

  return (
    <Link href="/loans" asChild>
      <Pressable accessibilityRole="button">
        <Card className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText variant="heading">Lån</AppText>
            <AppText variant="muted">Se afbetalingsplan ›</AppText>
          </View>
          <View className="flex-row items-baseline justify-between">
            <AppText variant="muted">Ydelse / md.</AppText>
            <MoneyText ore={monthly} whole variant="label" />
          </View>
          <View className="flex-row items-baseline justify-between">
            <AppText variant="muted">Restgæld</AppText>
            <MoneyText ore={remaining} whole variant="label" />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
