import { Card } from "@/components/ui/card";
import { AppText } from "@/components/ui/text";
import { View } from "@/tw";
import type { CustomLoan } from "../types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <AppText variant="muted">{label}</AppText>
      <AppText variant="label" selectable>
        {value}
      </AppText>
    </View>
  );
}

/** Kontooplysninger til udbetaling (vises kun hvis udfyldt). Værdier er selectable. */
export function PayeeCard({ payee }: { payee: CustomLoan["payee"] }) {
  const { bankName, regNo, accountNo } = payee;
  if (!bankName && !regNo && !accountNo) return null;

  return (
    <Card className="gap-2">
      <AppText variant="heading">Kontooplysninger til udbetaling</AppText>
      {bankName ? <Row label="Bank" value={bankName} /> : null}
      {regNo ? <Row label="Reg.nr." value={regNo} /> : null}
      {accountNo ? <Row label="Kontonr." value={accountNo} /> : null}
    </Card>
  );
}
