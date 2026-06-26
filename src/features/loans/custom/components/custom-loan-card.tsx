import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { currentRemainingOre, monthlyPaymentOre, payoffMonths, principalOre } from '../calc';
import type { CustomLoan } from '../types';

export function CustomLoanCard({ loan }: { loan: WithId<CustomLoan> }) {
  const principal = principalOre(loan.lineItems);
  const remaining = currentRemainingOre(loan);
  const paidRatio = principal > 0 ? (principal - remaining) / principal : 0;
  const months = payoffMonths(loan);

  return (
    <Link href={{ pathname: '/loans/[id]', params: { id: loan.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card className="gap-3">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <AppText variant="heading">{loan.name || 'Flytte-lån'}</AppText>
              <AppText variant="muted">Flytte-lån</AppText>
            </View>
            <AppText variant="muted">
              {Number.isFinite(months) ? `${months} mdr` : '—'}
            </AppText>
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-baseline justify-between">
              <MoneyText ore={remaining} whole variant="heading" />
              <View className="flex-row items-baseline gap-1">
                <AppText variant="muted">af</AppText>
                <MoneyText ore={principal} whole variant="muted" />
              </View>
            </View>
            <ProgressBar value={paidRatio} />
            <View className="flex-row justify-between">
              <AppText variant="muted">afdrag / md.</AppText>
              <MoneyText ore={monthlyPaymentOre(loan)} whole variant="muted" />
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
