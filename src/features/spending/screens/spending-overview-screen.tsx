import { Link } from "expo-router";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyText } from "@/components/ui/money-text";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { formatMonthCopenhagen, todayISODate } from "@/lib/datetime";
import type { WithId } from "@/lib/firebase";
import { Pressable, View } from "@/tw";
import { AccountRow } from "../components/account-row";
import { useSpendingSettingsStore } from "../data/spending-settings-store";
import { useTransactionsStore } from "../data/transactions-store";
import { monthlyTotals, spendingInMonthOre } from "../spending.utils";
import type { BankTransaction } from "../types";

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

const isWeb = process.env.EXPO_OS === "web";

export function SpendingOverviewScreen() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const loading = useTransactionsStore((s) => s.loading);
  const fromCache = useTransactionsStore((s) => s.fromCache);
  const accounts = useSpendingSettingsStore((s) => s.accounts);

  const month = todayISODate().slice(0, 7);
  // Tunge udledninger memoiseres → køres kun når transaktioner/konti ændres, ikke ved hver
  // render. Konti grupperes ÉN gang (byAccount) i stedet for at filtrere alle pr. konto.
  const { numbers, totalSpending, monthsTable, byAccount } = useMemo(() => {
    const grouped = new Map<string, WithId<BankTransaction>[]>();
    for (const t of transactions) {
      const arr = grouped.get(t.account);
      if (arr) arr.push(t);
      else grouped.set(t.account, [t]);
    }
    return {
      numbers: Array.from(grouped.keys()).sort(),
      totalSpending: spendingInMonthOre(transactions, month, accounts),
      monthsTable: Array.from(monthlyTotals(transactions, accounts).entries()).sort((a, b) =>
        b[0].localeCompare(a[0]),
      ),
      byAccount: grouped,
    };
  }, [transactions, accounts, month]);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Forbrug</AppText>
        <View className="flex-row gap-2">
          <Link href="/spending/settings" asChild>
            <Button
              title="Indstillinger"
              variant="secondary"
              className="h-10 px-4"
            />
          </Link>
          {isWeb ? (
            <Link href="/spending/import" asChild>
              <Button title="Importér" className="h-10 px-4" />
            </Link>
          ) : null}
        </View>
      </View>

      <OfflineNotice fromCache={fromCache} />

      {numbers.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen transaktioner endnu"
            description={
              isWeb
                ? "Importér en CSV-eksport fra banken for at se dit faktiske forbrug pr. konto."
                : "Importér bankdata på web — her kan du se forbruget bagefter."
            }
          />
        )
      ) : (
        <>
          <Card className="border-0 bg-accent-budget">
            <AppText className="text-on-primary/80">
              Forbrug denne måned (alle konti)
            </AppText>
            <MoneyText
              ore={totalSpending}
              whole
              className="text-3xl font-bold text-on-primary"
            />
          </Card>

          {monthsTable.length > 0 ? (
            <Card className="gap-2">
              <AppText variant="label">Forbrug pr. måned</AppText>
              {monthsTable.map(([ymKey, totals]) => (
                <Link
                  key={ymKey}
                  href={{
                    pathname: "/spending/month/[ym]",
                    params: { ym: ymKey },
                  }}
                  asChild
                >
                  <Pressable
                    accessibilityRole="button"
                    className="flex-row items-center justify-between rounded-lg py-1"
                  >
                    <AppText variant="muted">
                      {capitalize(formatMonthCopenhagen(`${ymKey}-01`))}
                    </AppText>
                    <View className="flex-row items-center gap-2">
                      <MoneyText
                        ore={totals.expenseOre}
                        whole
                        variant="label"
                        className="text-danger"
                      />
                    </View>
                  </Pressable>
                </Link>
              ))}
            </Card>
          ) : null}

          <AppText variant="label" className="pt-2">
            Konti
          </AppText>
          <View className="gap-2">
            {numbers.map((account) => (
              <AccountRow
                key={account}
                account={account}
                transactions={byAccount.get(account) ?? []}
                accounts={accounts}
                month={month}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
