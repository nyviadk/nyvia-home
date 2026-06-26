import { Link } from 'expo-router';

import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AppText } from "@/components/ui/text";
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { loanProgress, progressPercent } from '../loans.utils';
import type { Loan } from '../types';

export function LoanCard({ loan }: { loan: WithId<Loan> }) {
  const progress = loanProgress(loan);
  const pct = progressPercent(loan);

  return (
    <Link href={{ pathname: '/loans/[id]', params: { id: loan.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card className="gap-3">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <AppText variant="heading">{loan.name}</AppText>
              <AppText variant="muted">{loan.lender}</AppText>
            </View>
            <AppText variant="muted">{loan.interestRate}%</AppText>
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-baseline justify-between">
              <MoneyText ore={loan.currentBalance} whole variant="heading" />
              <View className="flex-row items-baseline gap-1">
                <AppText variant="muted">af</AppText>
                <MoneyText ore={loan.originalAmount} whole variant="muted" />
              </View>
            </View>
            <ProgressBar value={progress} />
            <View className="flex-row justify-between">
              <AppText variant="muted">{pct}% afdraget</AppText>
              <MoneyText ore={loan.monthlyPayment} whole variant="muted" />
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
