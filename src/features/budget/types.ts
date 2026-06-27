import type { Recurrence } from '@/lib/recurrence/types';

export type BudgetEntryType = 'income' | 'expense';

/**
 * Løn-beregner (estimat før den rigtige nettoløn kendes): brugeren taster brutto +
 * fradrag/AM-bidrag/trækprocent → estimeret netto bruges som postens `amount`.
 */
export type SalaryCalc = {
  grossOre: number;
  /** AM-bidrag i procent (typisk 8). */
  amBidragPct: number;
  /** Månedsfradrag i øre. */
  fradragOre: number;
  /** Trækprocent (A-skat). */
  traekPct: number;
};

/** En enkelt faktisk betaling for en måned (fx én af mange mad-indkøb). */
export type ActualLine = {
  id: string;
  amountOre: number;
  note?: string;
};

/** Prisændring fra og med en given måned (ÅÅÅÅ-MM) — "denne og fremover". */
export type PriceChange = {
  fromYm: string;
  amountOre: number;
};

/** En fast budgetpost (forecast). Beløb i øre, altid positivt; fortegn følger `type`. */
export type BudgetEntry = {
  name: string;
  type: BudgetEntryType;
  /** Forventet (start)beløb i øre. Senere prisændringer ligger i `priceChanges`. */
  amount: number;
  /** Én eller flere kategorier (tags). */
  categories: string[];
  /** @deprecated Legacy enkelt-kategori (ældre dokumenter) — læs via entryCategories(). */
  category?: string;
  recurrence: Recurrence;
  /**
   * Forudbetaling (typisk forudløn): beløbet udbetales i måneden FØR og tæller i
   * den efterfølgende budgetmåned. Fx løn udbetalt sidste bankdag i sep = oktobers
   * rådighedsbeløb. Kun relevant for indtægter.
   */
  advanceMonth?: boolean;
  /** Hvis sat: `amount` er en estimeret nettoløn beregnet fra disse før-skat-tal. */
  salaryCalc?: SalaryCalc;
  /** Prisændringer "denne og fremover" (sorteret efter fromYm). Påvirker ikke fortid. */
  priceChanges?: PriceChange[];
  /**
   * Faktiske beløb pr. budgetmåned (ÅÅÅÅ-MM → linjer). Summen overstyrer det
   * forventede for den måned; måneder uden faktisk falder tilbage til forventet.
   */
  actuals?: Record<string, ActualLine[]>;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetEntryInput = Pick<
  BudgetEntry,
  'name' | 'type' | 'amount' | 'categories' | 'recurrence' | 'advanceMonth' | 'salaryCalc' | 'note'
>;

/** Globale budget-indstillinger (ét dokument pr. bruger). */
export type BudgetSettings = {
  /** Budgettets startdato (ÅÅÅÅ-MM-DD). Poster kan ikke starte før denne. */
  startDate: string;
  updatedAt: string;
};
