/** Gentagelses-model (delt af budget + abonnementer). */
export type Cadence =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'yearly'
  | 'biennial'
  | 'triennial'
  | 'once';

/**
 * Dag i måneden for månedlige poster: et tal 1–31 (findes dagen ikke i måneden →
 * sidste mulige, rykket til foregående bankdag), første/sidste bankdag, eller
 * `'month'` = ingen bestemt dag (kun måneden tæller, fx Mad/Diverse).
 */
export type MonthlyDay = number | 'firstBank' | 'lastBank' | 'month';

export type Recurrence = {
  cadence: Cadence;
  /** Ankerdato (ÅÅÅÅ-MM-DD): første forekomst / definerer dag (kvartal/halvår/år) og start. */
  startDate: string;
  /** Valgfri slutdato (ÅÅÅÅ-MM-DD) — ingen forekomster efter denne måned. */
  endDate?: string;
  /** Kun for cadence='monthly'. Default = dag fra startDate. */
  monthlyDay?: MonthlyDay;
  /**
   * Kun for cadence='monthly': gentag hver N. måned (default 1). 3 = kvartal, 12 = år, 4 =
   * hver 4. måned. Anker = startmåneden. Generaliserer de faste cadencer, som bevares for
   * bagudkompatibilitet (en 'quarterly'-regel er identisk med monthly + intervalMonths:3).
   */
  intervalMonths?: number;
};
