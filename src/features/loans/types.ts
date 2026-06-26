import type { CustomLoan } from './custom/types';

/** Et standard-lån. Beløb i øre (heltal), datoer som ISO 8601. */
export type Loan = {
  /** Diskriminator; mangler på gamle dokumenter → behandles som standard. */
  type?: 'standard';
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
  /** Afdrags-log i selve dokumentet (ingen subcollection → kun én listener). */
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
};

/** Et registreret afdrag på et lån (gemmes i lån-dokumentets payments-array). */
export type Payment = {
  id: string;
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

/** Et lån af enten standard- eller custom-typen (diskrimineret på `type`). */
export type AnyLoan = Loan | CustomLoan;

/** True hvis lånet er et custom flytte-lån. */
export function isCustomLoan(loan: AnyLoan): loan is CustomLoan {
  return loan.type === 'custom';
}
