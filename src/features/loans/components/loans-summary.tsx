import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { AppText } from "@/components/ui/text";
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { totalBalance, totalMonthlyPayment } from '../loans.utils';
import type { AnyLoan } from '../types';

/** Topkort: samlet restgæld + samlet månedlig ydelse over alle lån. */
export function LoansSummary({ loans }: { loans: WithId<AnyLoan>[] }) {
  return (
    <Card className="gap-4 border-0 bg-primary">
      <View className="gap-1">
        <AppText className="text-on-primary/80">Samlet restgæld</AppText>
        <MoneyText ore={totalBalance(loans)} whole className="text-3xl font-bold text-on-primary" />
      </View>
      <View className="flex-row items-baseline justify-between">
        <AppText className="text-on-primary/80">Samlet ydelse / md.</AppText>
        <MoneyText ore={totalMonthlyPayment(loans)} whole className="font-semibold text-on-primary" />
      </View>
    </Card>
  );
}
