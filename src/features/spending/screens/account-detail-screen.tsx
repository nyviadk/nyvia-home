import { useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { formatMonthCopenhagen, todayISODate } from "@/lib/datetime";
import { MonthAccordion } from "../components/month-accordion";
import { TransactionRow } from "../components/transaction-row";
import { useSpendingSettingsStore } from "../data/spending-settings-store";
import { useTransactionsStore } from "../data/transactions-store";
import { displayAccountName, monthlyTotals, ym } from "../spending.utils";

export function AccountDetailScreen() {
  const { account } = useLocalSearchParams<{ account: string }>();
  const transactions = useTransactionsStore((s) => s.transactions);
  const accounts = useSpendingSettingsStore((s) => s.accounts);

  const own = transactions.filter((t) => t.account === account);
  const totals = monthlyTotals(own, accounts);
  const months = Array.from(new Set(own.map((t) => ym(t.date)))).sort((a, b) =>
    b.localeCompare(a),
  );
  const currentMonth = todayISODate().slice(0, 7);

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
        months.map((month) => {
          const t = totals.get(month) ?? { expenseOre: 0, incomeOre: 0 };
          return (
            <MonthAccordion
              key={month}
              title={capitalize(formatMonthCopenhagen(`${month}-01`))}
              totalOre={t.expenseOre}
            >
              {own
                .filter((tx) => ym(tx.date) === month)
                .map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
            </MonthAccordion>
          );
        })
      )}
    </Screen>
  );
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
