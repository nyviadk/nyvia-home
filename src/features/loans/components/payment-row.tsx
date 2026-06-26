import { MoneyText } from "@/components/ui/money-text";
import { AppText } from "@/components/ui/text";
import { formatDateCopenhagen } from '@/lib/datetime';
import { View } from '@/tw';
import type { Payment } from '../types';

export function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border py-3">
      <View className="flex-1">
        <AppText variant="label">{formatDateCopenhagen(payment.date)}</AppText>
        {payment.note ? <AppText variant="muted">{payment.note}</AppText> : null}
      </View>
      <MoneyText ore={payment.amount} whole variant="label" />
    </View>
  );
}
