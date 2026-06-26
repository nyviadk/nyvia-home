/** Custom flytte-lån (rigere model end standard-lånet). Beløb i øre, datoer ISO. */

/** En underpost (fx vaskemaskine under "Salg"). Beløb signed (negativt = indtægt). */
export type LineItemChild = {
  id: string;
  label: string;
  amount: number; // øre, signed
};

/**
 * En post der indgår i lånets hovedstol; kan slås til/fra (med/uden).
 * Beløb er signed: negativt = indtægt (fx salg/depositum-refusion), positivt = udgift.
 * Har posten `children`, er dens beløb summen af dem (amount ignoreres).
 */
export type LoanLineItem = {
  id: string;
  label: string;
  amount: number; // øre, signed (bruges hvis ingen children)
  included: boolean;
  children?: LineItemChild[];
};

/** En udgiftsrække med valgfri fritekst-note. */
export type ExpenseRow = {
  id: string;
  label: string;
  amount: number; // øre (kan være negativ, fx boligstøtte)
  note?: string;
};

/** En navngiven udgiftstabel (fx ny bolig / nuværende bolig). */
export type ExpenseTable = {
  title: string;
  rows: ExpenseRow[];
};

/** Udlejerens betalingsoplysninger. */
export type PayeeInfo = {
  regNo: string;
  accountNo: string;
  bankName: string;
};

/** Afbetalings-horisont: hurtigst muligt, eller fordel over 24/48 måneder. */
export type RepaymentHorizon = 'asap' | 'm24' | 'm48';

/** Buffer: behold et fast beløb pr. md. som opsparing (trækkes fra afdraget). */
export type Buffer = {
  amount: number; // øre
  enabled: boolean;
};

export type CustomLoan = {
  type: 'custom';
  name: string;
  payee: PayeeInfo;
  lineItems: LoanLineItem[];
  newHome: ExpenseTable;
  oldHome: ExpenseTable;
  buffer: Buffer;
  horizon: RepaymentHorizon;
  /** Første afbetalings-måned, ÅÅÅÅ-MM. */
  startMonth: string;
  /** Faktiske afdrag pr. måned: { 'ÅÅÅÅ-MM': øre }. */
  actuals: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};
