import BigNumber from "bignumber.js";
import { DateTime } from "luxon";

import { APP_TIMEZONE } from "@/lib/datetime";
import { monthlyAverageOre, occursInMonth } from "@/lib/recurrence/engine";
import type { Recurrence } from "@/lib/recurrence/types";
import {
  actualTotalOre,
  effectivePriceOre,
  effectiveSavingsPercent,
  ym as toYm,
} from "./pricing";
import type { ActualLine, PriceChange, SavingsPercentChange } from "./types";

/** En gentaget regel med beløb (øre, positivt). */
export type ForecastRule = {
  /** Forventet grundbeløb (øre). Senere prisændringer ligger i `priceChanges`. */
  amount: number;
  recurrence: Recurrence;
  /** Forudbetaling: udbetales måneden før og tæller i den efterfølgende måned. */
  advanceMonth?: boolean;
  /** Prisændringer "denne og fremover". */
  priceChanges?: PriceChange[];
  /** Faktiske beløb pr. budgetmåned (ÅÅÅÅ-MM → linjer). Overstyrer forventet i realistisk mode. */
  actuals?: Record<string, ActualLine[]>;
};

/**
 * 'smoothed' (hensat): periodiske beløb spredes jævnt over året — ingen måned dykker.
 * 'realistic': beløbet tæller i den måned det falder; faktiske beløb overstyrer forventet.
 */
export type ForecastMode = "realistic" | "smoothed";

/** Et lån i forecasten: restgæld + månedlig ydelse + første afbetalingsmåned (ÅÅÅÅ-MM). */
export type LoanForecast = {
  remainingOre: number;
  monthlyOre: number;
  /** Første afbetalingsmåned (ÅÅÅÅ-MM). Ydelsen starter her (eller nu, hvis allerede i gang). */
  startMonth: string;
};

/**
 * Afkoblet input til forecasten. Dashboardet samler det fra budget-poster,
 * aktive abonnementer og lån.
 */
export type ForecastInput = {
  incomeRules: ForecastRule[];
  expenseRules: ForecastRule[];
  /** Lån — ydelsen trækkes kun indtil restgælden er afdraget (sidste måned = resten). */
  loans: LoanForecast[];
  /** Automatisk opsparing: grund-procent (0–100) af månedens resterende rådighedsbeløb. */
  savingsPercent?: number;
  /** Fremadrettede ændringer af opsparingsprocenten (påvirker ikke fortiden). */
  savingsPercentChanges?: SavingsPercentChange[];
  /** Faktisk opsparing pr. måned (ÅÅÅÅ-MM → øre); overstyrer procenten. */
  savingsActuals?: Record<string, number>;
};

export type MonthForecast = {
  ym: string;
  income: number;
  expenses: number;
  /** Rådighedsbeløb FØR opsparing (income − expenses). */
  baseNet: number;
  /** Beløb sat til side til opsparing denne måned. */
  savings: number;
  /** Rådighedsbeløb efter opsparing (baseNet − savings). */
  net: number;
};

/** Planlagt opsparing for en måned: faktisk (override) eller procent af resterende rådighed. */
function savingsForMonth(
  input: ForecastInput,
  monthYm: string,
  baseNet: number,
  useActuals: boolean
): number {
  const override = useActuals ? input.savingsActuals?.[monthYm] : undefined;
  if (override !== undefined) return override;
  const pct = effectiveSavingsPercent(
    input.savingsPercent ?? 0,
    input.savingsPercentChanges,
    monthYm
  );
  if (pct <= 0 || baseNet <= 0) return 0;
  return new BigNumber(baseNet).times(pct).div(100).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}

/**
 * Samlet lån-ydelse for en given måned. Afbetalingen starter i lånets `startMonth`
 * (eller nu, hvis lånet allerede er i gang) og løber til restgælden er afdraget —
 * den sidste måned trækker kun resten (ikke hele ydelsen), og derefter 0.
 */
export function loanPaymentForMonth(
  loans: LoanForecast[],
  year: number,
  month: number
): number {
  const now = DateTime.now().setZone(APP_TIMEZONE).startOf('month');
  const target = DateTime.fromObject({ year, month }, { zone: APP_TIMEZONE }).startOf('month');

  return loans
    .reduce((sum, l) => {
      if (l.monthlyOre <= 0) return sum;
      // Afbetaling begynder ved startMonth — eller nu, hvis lånet allerede er i gang
      // (restgælden afspejler da allerede de betalinger der er foretaget).
      const start = DateTime.fromISO(`${l.startMonth}-01`, { zone: APP_TIMEZONE }).startOf('month');
      const begin = start > now ? start : now;
      const i = Math.round(target.diff(begin, 'months').months);
      if (i < 0) return sum; // før afbetalingen begynder
      const balanceAtStart = new BigNumber(l.remainingOre).minus(
        new BigNumber(l.monthlyOre).times(i)
      );
      if (balanceAtStart.lte(0)) return sum;
      return sum.plus(BigNumber.min(l.monthlyOre, balanceAtStart));
    }, new BigNumber(0))
    .toNumber();
}

/** Forventet beløb for en regel i en given budgetmåned (efter evt. prisændringer). */
function expectedForMonth(rule: ForecastRule, monthYm: string): number {
  return effectivePriceOre(rule.amount, rule.priceChanges, monthYm);
}

/**
 * Sum af regler der bidrager til (year, month). En forudbetalt regel udbetales
 * måneden før, så den tæller i denne måned hvis dens forekomst falder i forrige måned.
 * - realistic: beløb i den måned det falder; faktisk (sum af linjer) overstyrer forventet.
 * - smoothed: hver regel bidrager med sit månedsgennemsnit (periodiske spredes ud).
 */
function sumForMonth(
  rules: ForecastRule[],
  year: number,
  month: number,
  mode: ForecastMode,
  useActuals = true,
): number {
  const monthYm = toYm(year, month);
  const prev = DateTime.fromObject(
    { year, month },
    { zone: APP_TIMEZONE },
  ).minus({ months: 1 });

  return rules
    .reduce((sum, r) => {
      if (mode === "smoothed") {
        // Udjævnet plan: spred periodiske beløb; ingen forudløn-/faktisk-justering.
        return sum.plus(
          monthlyAverageOre(expectedForMonth(r, monthYm), r.recurrence),
        );
      }
      const occurs = r.advanceMonth
        ? occursInMonth(r.recurrence, prev.year, prev.month)
        : occursInMonth(r.recurrence, year, month);
      if (!occurs) return sum;
      const actual = useActuals ? actualTotalOre(r.actuals, monthYm) : null;
      return sum.plus(actual ?? expectedForMonth(r, monthYm));
    }, new BigNumber(0))
    .toNumber();
}

/** Forecast for én måned i valgt mode. `useActuals=false` giver det rene forventede. */
export function monthForecast(
  year: number,
  month: number,
  input: ForecastInput,
  mode: ForecastMode = "realistic",
  useActuals = true,
): MonthForecast {
  const monthYm = toYm(year, month);
  const income = sumForMonth(input.incomeRules, year, month, mode, useActuals);
  const expenses = new BigNumber(
    sumForMonth(input.expenseRules, year, month, mode, useActuals),
  )
    .plus(loanPaymentForMonth(input.loans, year, month))
    .toNumber();
  const baseNet = new BigNumber(income).minus(expenses).toNumber();
  const savings = savingsForMonth(input, monthYm, baseNet, useActuals);
  return {
    ym: monthYm,
    income,
    expenses,
    baseNet,
    savings,
    net: new BigNumber(baseNet).minus(savings).toNumber(),
  };
}

/** En måned med både forventet og aktuel net (per måned, ikke akkumuleret). */
export type RunningMonth = {
  ym: string;
  forventetNet: number;
  aktuelNet: number;
  hasActuals: boolean;
};

/**
 * Forecast pr. måned: hver måneds eget net (forventet og aktuel). IKKE akkumuleret —
 * et overskud/underskud bæres først videre når måneden i virkeligheden er omme
 * (se `carriedBalanceOre`). Aktuel bruger faktiske beløb hvor de er registreret.
 */
export function runningForecast(
  count: number,
  input: ForecastInput,
  fromMonthISO?: string,
  mode: ForecastMode = "realistic",
): RunningMonth[] {
  const base = fromMonthISO
    ? DateTime.fromISO(fromMonthISO, { zone: APP_TIMEZONE })
    : DateTime.now().setZone(APP_TIMEZONE);
  const start = base.startOf("month");

  const out: RunningMonth[] = [];
  for (let i = 0; i < count; i++) {
    const d = start.plus({ months: i });
    const forventetNet = monthForecast(d.year, d.month, input, mode, false).net;
    const aktuelNet = monthForecast(d.year, d.month, input, mode, true).net;
    out.push({
      ym: toYm(d.year, d.month),
      forventetNet,
      aktuelNet,
      hasActuals: aktuelNet !== forventetNet,
    });
  }
  return out;
}

/**
 * Overført saldo fra AFSLUTTEDE måneder: summen af realiserede (aktuelle) net for
 * hver måned fra budgetstart til og med sidste hele måned før denne måned. Måneder
 * der endnu ikke er omme tæller ikke med (carry-over sker først når måneden er omme).
 */
export function carriedBalanceOre(
  input: ForecastInput,
  budgetStartDate: string | null
): number {
  if (!budgetStartDate) return 0;
  const start = DateTime.fromISO(budgetStartDate, { zone: APP_TIMEZONE }).startOf("month");
  const current = DateTime.now().setZone(APP_TIMEZONE).startOf("month");
  let balance = new BigNumber(0);
  let d = start;
  while (d < current) {
    balance = balance.plus(monthForecast(d.year, d.month, input, "realistic", true).net);
    d = d.plus({ months: 1 });
  }
  return balance.toNumber();
}

/**
 * Samlet opsparet hidtil: summen af opsparingen for hver måned fra budgetstart til og
 * med DENNE måned. Bruger faktisk opsparing hvor den er indtastet, ellers forventet
 * (procent). Fremtidige måneder tæller ikke med.
 */
export function totalSavedOre(input: ForecastInput, budgetStartDate: string | null): number {
  if (!budgetStartDate) return 0;
  const start = DateTime.fromISO(budgetStartDate, { zone: APP_TIMEZONE }).startOf("month");
  const current = DateTime.now().setZone(APP_TIMEZONE).startOf("month");
  if (current < start) return 0;
  let total = new BigNumber(0);
  let d = start;
  while (d <= current) {
    total = total.plus(monthForecast(d.year, d.month, input, "realistic", true).savings);
    d = d.plus({ months: 1 });
  }
  return total.toNumber();
}

/**
 * Ankermåneden for forecasten (ÅÅÅÅ-MM-DD = 1. i måneden): den seneste af "denne
 * måned" og budgettets startmåned. Før budgetstart findes der intet budget.
 */
export function forecastAnchorISO(budgetStartDate: string | null): string {
  const now = DateTime.now().setZone(APP_TIMEZONE).startOf("month");
  if (!budgetStartDate) return now.toFormat("yyyy-MM-dd");
  const start = DateTime.fromISO(budgetStartDate, {
    zone: APP_TIMEZONE,
  }).startOf("month");
  return (start > now ? start : now).toFormat("yyyy-MM-dd");
}

/** Ankermåned + de næste (count-1) måneder. Default-anker = denne måned. */
export function forecastMonths(
  count: number,
  input: ForecastInput,
  fromMonthISO?: string,
  mode: ForecastMode = "realistic",
): MonthForecast[] {
  const base = fromMonthISO
    ? DateTime.fromISO(fromMonthISO, { zone: APP_TIMEZONE })
    : DateTime.now().setZone(APP_TIMEZONE);
  const start = base.startOf("month");
  const out: MonthForecast[] = [];
  for (let i = 0; i < count; i++) {
    const d = start.plus({ months: i });
    out.push(monthForecast(d.year, d.month, input, mode));
  }
  return out;
}

/** Gennemsnitligt månedligt rådighedsbeløb (udjævner kvartal/halvår/år). */
export function averageDisposableOre(input: ForecastInput): number {
  const avg = (rules: ForecastRule[]) =>
    rules.reduce(
      (sum, r) => sum.plus(monthlyAverageOre(r.amount, r.recurrence)),
      new BigNumber(0),
    );
  const loanMonthly = input.loans.reduce(
    (sum, l) => sum.plus(l.monthlyOre),
    new BigNumber(0),
  );
  return avg(input.incomeRules)
    .minus(avg(input.expenseRules))
    .minus(loanMonthly)
    .toNumber();
}
