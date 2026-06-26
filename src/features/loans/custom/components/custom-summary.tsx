import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import {
  currentRemainingOre,
  monthlyAvailableOre,
  monthlyPaymentOre,
  payoffMonths,
  principalOre,
  savingsAfterOre,
} from '../calc';
import type { CustomLoan } from '../types';

function Row({ label, ore }: { label: string; ore: number }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <AppText variant="muted">{label}</AppText>
      <MoneyText ore={ore} whole variant="label" />
    </View>
  );
}

/** Nøgletal for et custom flytte-lån. */
export function CustomSummary({ loan }: { loan: WithId<CustomLoan> }) {
  const months = payoffMonths(loan);
  return (
    <Card className="gap-3">
      <View className="gap-1">
        <AppText variant="muted">Restgæld</AppText>
        <MoneyText
          ore={currentRemainingOre(loan)}
          whole
          className="text-3xl font-bold text-accent-loans"
        />
      </View>
      <Row label="Hovedstol" ore={principalOre(loan.lineItems)} />
      <Row label="Rådighedsbeløb / md." ore={monthlyAvailableOre(loan)} />
      <Row label="Afdrag / md." ore={monthlyPaymentOre(loan)} />
      <View className="flex-row justify-between">
        <AppText variant="muted">Betalt om</AppText>
        <AppText variant="label">{Number.isFinite(months) ? `${months} mdr` : '—'}</AppText>
      </View>
      <View className="mt-1 gap-1 border-t border-border pt-2">
        <Row label="Opsparing efter 12 mdr" ore={savingsAfterOre(loan, 12)} />
        <Row label="Opsparing efter 24 mdr" ore={savingsAfterOre(loan, 24)} />
        <Row label="Opsparing efter 48 mdr" ore={savingsAfterOre(loan, 48)} />
      </View>
    </Card>
  );
}
