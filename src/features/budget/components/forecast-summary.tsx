import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { Segmented } from "@/components/ui/segmented";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { formatMonthCopenhagen, todayISODate } from "@/lib/datetime";
import { View } from "@/tw";
import { useBudgetSettingsStore } from "../data/budget-settings-store";
import {
  setBudgetViewMode,
  useBudgetViewStore,
} from "../data/budget-view-store";
import {
  carriedBalanceOre,
  forecastAnchorISO,
  type ForecastMode,
  runningForecast,
  totalSavedOre,
} from "../forecast";
import { useBudgetOverview } from "../hooks/use-budget-overview";
import { useForecastInput } from "../hooks/use-forecast";
import { ForecastMonthRow } from "./forecast-month-row";

const MODE_OPTIONS = [
  { value: "realistic" as const, label: "Realistisk" },
  { value: "smoothed" as const, label: "Hensat" },
];

function Row({
  label,
  ore,
  sign,
  strong,
}: {
  label: string;
  ore: number;
  sign?: "+" | "−";
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-baseline justify-between">
      <AppText variant={strong ? "label" : "muted"}>
        {sign ? `${sign} ` : ""}
        {label}
      </AppText>
      <MoneyText ore={ore} whole variant={strong ? "label" : "muted"} />
    </View>
  );
}

/** Forecast-overblik: rådighedsbeløb i ankermåneden + gennemsnits-nedbrydning + kommende måneder. */
export function ForecastSummary() {
  const input = useForecastInput();
  const overview = useBudgetOverview();
  const startDate = useBudgetSettingsStore((s) => s.startDate);
  const savingsPercent = useBudgetSettingsStore((s) => s.savingsPercent);
  const mode = useBudgetViewStore((s) => s.mode);

  const anchorISO = forecastAnchorISO(startDate);
  const months = runningForecast(12, input, anchorISO, mode);
  const anchor = months[0];
  const isThisMonth = anchorISO.slice(0, 7) === todayISODate().slice(0, 7);
  const yearlyDisposable = overview.disposableOre * 12;
  // Overført saldo fra måneder der allerede er omme (carry-over sker først når måneden er omme).
  const carried = carriedBalanceOre(input, startDate);
  // Samlet opsparet hidtil (faktisk hvor indtastet, ellers forventet).
  const totalSaved = totalSavedOre(input, startDate);
  const showSavings = savingsPercent > 0 || totalSaved !== 0;

  return (
    <View className="gap-3">
      <Card className="gap-3 border-0 bg-primary">
        <View className="gap-1">
          <AppText className="text-on-primary/80">
            Rådighedsbeløb{" "}
            {isThisMonth
              ? "denne måned"
              : `· ${formatMonthCopenhagen(`${anchorISO.slice(0, 7)}-01`)}`}
          </AppText>
          <MoneyText
            ore={anchor.aktuelNet}
            whole
            className="text-3xl font-bold text-on-primary"
          />
        </View>
        <View className="flex-row items-baseline justify-between">
          <AppText className="text-on-primary/80">Gennemsnit / md.</AppText>
          <MoneyText
            ore={overview.disposableOre}
            whole
            className="font-semibold text-on-primary"
          />
        </View>
      </Card>

      {showSavings ? (
        <Card className="flex-row items-baseline justify-between border-0 bg-accent-savings">
          <AppText className="text-on-primary/80">Opsparet hidtil</AppText>
          <MoneyText ore={totalSaved} whole className="text-xl font-bold text-on-primary" />
        </Card>
      ) : null}

      <Card className="gap-2">
        <AppText variant="heading">Gennemsnit pr. måned</AppText>
        <Row label="Indtægter" ore={overview.incomeOre} sign="+" />
        <Row label="Faste udgifter" ore={overview.expenseOre} sign="−" />
        {overview.subscriptionsOre !== 0 ? (
          <Row label="Abonnementer" ore={overview.subscriptionsOre} sign="−" />
        ) : null}
        {overview.loansOre !== 0 ? <Row label="Lån" ore={overview.loansOre} sign="−" /> : null}
        {overview.savingsOre !== 0 ? (
          <Row label="Opsparing" ore={overview.savingsOre} sign="−" />
        ) : null}
        <View className="mt-1 border-t border-border pt-2">
          <Row
            label="Rådighedsbeløb / md."
            ore={overview.disposableOre}
            strong
          />
        </View>
        <View className="flex-row items-baseline justify-between">
          <AppText variant="muted">Rådighedsbeløb / år</AppText>
          <MoneyText ore={yearlyDisposable} whole variant="muted" />
        </View>
      </Card>

      <Card className="gap-2">
        <View className="flex-row items-center justify-between">
          <AppText variant="heading">Kommende måneder</AppText>
        </View>
        <Segmented<ForecastMode>
          value={mode}
          options={MODE_OPTIONS}
          onChange={setBudgetViewMode}
        />
        <AppText variant="muted">
          {mode === "smoothed"
            ? "Periodiske regninger fordeles jævnt (hensat). Niveauet kan stadig skifte ved lån-afvikling, prisændringer, start/slut på poster og opsparing."
            : "Beløb vises i den måned de falder; faktiske beløb overstyrer forventet."}{" "}
          Net pr. måned — overskud/underskud bæres først videre når måneden er omme.
        </AppText>
        {carried !== 0 ? (
          <View className="flex-row items-baseline justify-between border-t border-border pt-1">
            <AppText variant="muted">Overført fra afsluttede måneder</AppText>
            <MoneyText
              ore={carried}
              whole
              variant="label"
              className={cn(carried < 0 && "text-danger")}
            />
          </View>
        ) : null}
        <View className="flex-row items-baseline pb-1">
          <AppText variant="muted" className="flex-1 text-xs">
            Måned
          </AppText>
          <AppText variant="muted" className="flex-1 text-right text-xs">
            Forventet
          </AppText>
          <AppText variant="muted" className="flex-1 text-right text-xs">
            Aktuel
          </AppText>
        </View>
        {months.map((m) => (
          <ForecastMonthRow key={m.ym} month={m} />
        ))}
      </Card>
    </View>
  );
}
