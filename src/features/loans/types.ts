/** Et lån. Beløb i øre (heltal), datoer som ISO 8601. */
export type Loan = {
  name: string;
  lender: string;
  /** Gæld da tracking startede (basis for fremgangs-beregning). */
  originalAmount: number;
  /** Aktuel restgæld. */
  currentBalance: number;
  /** Årlig rente i procent. */
  interestRate: number;
  /** Månedlig ydelse. */
  monthlyPayment: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
};

/** Et registreret afdrag på et lån. */
export type Payment = {
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
};

/** Felter brugeren udfylder (afledte felter sættes i repository). */
export type LoanInput = Pick<
  Loan,
  'name' | 'lender' | 'originalAmount' | 'currentBalance' | 'interestRate' | 'monthlyPayment' | 'startDate'
>;
