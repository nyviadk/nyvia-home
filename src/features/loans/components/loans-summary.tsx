import { AppText, Card, MoneyText } from '@/components/ui';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { totalBalance, totalMonthlyPayment } from '../loans.utils';
import type { Loan } from '../types';

/** Topkort: samlet restgæld + samlet månedlig ydelse over alle lån. */
export function LoansSummary({ loans }: { loans: WithId<Loan>[] }) {
  return (
    <Card className="gap-4 bg-primary">
      <View className="gap-1">
        <AppText className="text-white/80">Samlet restgæld</AppText>
        <MoneyText ore={totalBalance(loans)} whole className="text-3xl font-bold text-white" />
      </View>
      <View className="flex-row items-baseline justify-between">
        <AppText className="text-white/80">Samlet ydelse / md.</AppText>
        <MoneyText ore={totalMonthlyPayment(loans)} whole className="font-semibold text-white" />
      </View>
    </Card>
  );
}
