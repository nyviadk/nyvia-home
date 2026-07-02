/** Boligens status i din tidslinje. */
export type HomeStatus = 'kommende' | 'nuværende' | 'tidligere';

export const HOME_STATUSES: { value: HomeStatus; label: string }[] = [
  { value: 'kommende', label: 'Kommende' },
  { value: 'nuværende', label: 'Nuværende' },
  { value: 'tidligere', label: 'Tidligere' },
];

/** Udlejer-info (ligger inline på boligen — én pr. bolig). */
export type Landlord = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Bank: registreringsnummer + kontonummer (separate, som i lån). */
  regNo?: string;
  accountNo?: string;
  notes?: string;
};

/** En bolig. Adressen er navnet. Alt flytte-relateret hænger på dens id. */
export type Home = {
  /** Vej + nr. (identificerer boligen). */
  address: string;
  postalCode?: string;
  city?: string;
  status: HomeStatus;
  /** ISO-datoer (ÅÅÅÅ-MM-DD). */
  moveInDate?: string;
  moveOutDate?: string;
  landlord?: Landlord;
  /** Fri ekstra-info til indflytningssyn-PDF'en (navn, indflytningsdato mv.). */
  reportInfo?: string;
  createdAt: string;
  updatedAt: string;
};

export type HomeInput = Pick<
  Home,
  'address' | 'postalCode' | 'city' | 'status' | 'moveInDate' | 'moveOutDate' | 'landlord'
>;

/** "Postnr. by" eller tom streng. */
export function homeLocation(home: Pick<Home, 'postalCode' | 'city'>): string {
  return [home.postalCode, home.city].filter(Boolean).join(' ');
}
