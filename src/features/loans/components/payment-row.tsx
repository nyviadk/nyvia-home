import { AppText, MoneyText } from '@/components/ui';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import type { Payment } from '../types';

export function PaymentRow({ payment }: { payment: WithId<Payment> }) {
  return (
    <View className="flex-row items-center justify-between border-b border-selected py-3">
      <View className="flex-1">
        <AppText variant="label">{formatDateCopenhagen(payment.date)}</AppText>
        {payment.note ? <AppText variant="muted">{payment.note}</AppText> : null}
      </View>
      <MoneyText ore={payment.amount} whole variant="label" />
    </View>
  );
}
