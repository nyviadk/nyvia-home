/** Gentagelses-model (delt af budget + abonnementer). */
export type Cadence = 'monthly' | 'quarterly' | 'yearly' | 'once';

/** Dag i måneden for månedlige poster: et tal 1–28, første bankdag eller sidste bankdag. */
export type MonthlyDay = number | 'firstBank' | 'lastBank';

export type Recurrence = {
  cadence: Cadence;
  /** Ankerdato (ÅÅÅÅ-MM-DD): første forekomst / definerer dag (kvartal/år) og start. */
  startDate: string;
  /** Valgfri slutdato (ÅÅÅÅ-MM-DD) — ingen forekomster efter denne måned. */
  endDate?: string;
  /** Kun for cadence='monthly'. Default = dag fra startDate. */
  monthlyDay?: MonthlyDay;
};
