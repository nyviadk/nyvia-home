import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyText } from "@/components/ui/money-text";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { formatMonthCopenhagen } from "@/lib/datetime";
import type { WithId } from "@/lib/firebase";
import { View } from "@/tw";
import { MonthAccordion } from "../components/month-accordion";
import { TransactionRow } from "../components/transaction-row";
import { useSpendingSettingsStore } from "../data/spending-settings-store";
import { useTransactionsStore } from "../data/transactions-store";
import { displayAccountName, monthlyTotals, ym } from "../spending.utils";
import type { BankTransaction } from "../types";

export function AccountDetailScreen() {
  const { account } = useLocalSearchParams<{ account: string }>();
  const transactions = useTransactionsStore((s) => s.transactions);
  const accounts = useSpendingSettingsStore((s) => s.accounts);

  // Alt udledt memoiseret: filtrér kontoens poster, gruppér pr. måned ÉN gang (byMonth),
  // og udregn gennemsnit/højeste måned. Køres kun når transaktioner/konto/konti ændres.
  const { own, months, average, highest, byMonth, totalsByMonth } = useMemo(() => {
    const own = transactions.filter((t) => t.account === account);
    const totals = monthlyTotals(own, accounts);
    const byMonth = new Map<string, WithId<BankTransaction>[]>();
    for (const t of own) {
      const key = ym(t.date);
      const arr = byMonth.get(key);
      if (arr) arr.push(t);
      else byMonth.set(key, [t]);
    }
    const months = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));
    const perMonth = months.map((m) => totals.get(m)?.expenseOre ?? 0);
    const sum = perMonth.reduce((s, ore) => s + ore, 0);
    const average = perMonth.length ? Math.round(sum / perMonth.length) : 0;
    const highest = months.reduce(
      (best, m) => {
        const ore = totals.get(m)?.expenseOre ?? 0;
        return ore > best.ore ? { month: m, ore } : best;
      },
      { month: "", ore: 0 },
    );
    return { own, months, average, highest, byMonth, totalsByMonth: totals };
  }, [transactions, account, accounts]);

  return (
    <Screen>
      <AppText variant="title">
        {displayAccountName(account ?? "", accounts)}
      </AppText>

      {own.length === 0 ? (
        <EmptyState
          title="Ingen transaktioner"
          description="Denne konto har endnu ingen importerede poster."
        />
      ) : (
        <>
          <Card className="gap-2">
            <Stat label="Gennemsnit / md." ore={average} />
            <Stat
              label="Højeste måned"
              ore={highest.ore}
              hint={
                highest.month
                  ? capitalize(formatMonthCopenhagen(`${highest.month}-01`))
                  : undefined
              }
            />
          </Card>

          {months.map((month) => {
            const t = totalsByMonth.get(month) ?? { expenseOre: 0, incomeOre: 0 };
            return (
              <MonthAccordion
                key={month}
                title={capitalize(formatMonthCopenhagen(`${month}-01`))}
                totalOre={t.expenseOre}
              >
                {(byMonth.get(month) ?? []).map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </MonthAccordion>
            );
          })}
        </>
      )}
    </Screen>
  );
}

function Stat({
  label,
  ore,
  hint,
}: {
  label: string;
  ore: number;
  hint?: string;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <AppText variant="muted">
        {label}
        {hint ? ` · ${hint}` : ""}
      </AppText>
      <MoneyText ore={ore} whole variant="label" className="text-danger" />
    </View>
  );
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
