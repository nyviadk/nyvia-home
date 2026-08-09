import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { LoanProgressBlock } from '../../components/loan-progress-block';
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

          <LoanProgressBlock
            currentOre={remaining}
            originalOre={principal}
            progress={paidRatio}
            footerLeft="afdrag / md."
            footerRight={<MoneyText ore={monthlyPaymentOre(loan)} whole variant="muted" />}
          />
        </Card>
      </Pressable>
    </Link>
  );
}
