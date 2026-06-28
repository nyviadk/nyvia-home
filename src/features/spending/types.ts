/** Klassifikation af en banktransaktion. `internal` = overførsel mellem egne konti. */
export type TransactionKind = 'expense' | 'income' | 'internal';

export const TRANSACTION_KINDS: { value: TransactionKind; label: string }[] = [
  { value: 'expense', label: 'Udgift' },
  { value: 'income', label: 'Indtægt' },
  { value: 'internal', label: 'Intern' },
];

/**
 * En importeret banktransaktion. Dokument-id er deterministisk (se transaction-id.ts),
 * så gen-import af overlappende perioder overskriver i stedet for at duplikere.
 * Beløb i øre (fortegn: negativt = penge ud). Datoer ISO (yyyy-MM-dd). Tekst-felter
 * er RÅ (rense-regler anvendes ved visning). Klassifikationen beregnes også ved
 * visning ud fra de aktuelle konti — kun en evt. manuel `kindOverride` gemmes.
 */
export type BankTransaction = {
  /** Exportkonto-nummer (den egen-konto rækken hører til). */
  account: string;
  date: string;
  text: string;
  amountOre: number;
  balanceOre: number | null;
  payer: string | null;
  counterparty: string | null;
  accountHolder: string | null;
  senderAccount: string | null;
  receiverAccount: string | null;
  transferType: string | null;
  /** Manuel overstyring af klassifikationen (vinder over den beregnede). null = auto. */
  kindOverride?: TransactionKind | null;
  importBatchId: string;
  importedAt: string;
  updatedAt: string;
};

/** Kolonner som rense-regler kan virke på. */
export type ScrubColumn = 'text' | 'payer' | 'counterparty';

export const SCRUB_COLUMNS: { value: ScrubColumn; label: string }[] = [
  { value: 'payer', label: 'Indbetaler' },
  { value: 'text', label: 'Tekst' },
  { value: 'counterparty', label: 'Modtagernavn' },
];

/** "Hvis {column} indeholder {contains} → erstat hele feltet med {replaceWith}". */
export type ScrubRule = {
  id: string;
  column: ScrubColumn;
  contains: string;
  replaceWith: string;
};

/**
 * En konto fra CSV'en: nummer + brugervalgt navn. `internal` = en af mine egne konti,
 * så overførsler til/fra den ikke tæller som forbrug (matches sikkert på kontonummer).
 */
export type OwnAccount = {
  number: string;
  name: string;
  internal: boolean;
};

/** Ét settings-dokument pr. bruger: users/{uid}/settings/spending. */
export type SpendingSettings = {
  accounts?: OwnAccount[];
  scrubRules?: ScrubRule[];
  updatedAt?: string;
};

/** En registreret import (så en fejl-import kan slettes igen). */
export type ImportBatch = {
  fileName: string;
  importedAt: string;
  count: number;
  internalCount: number;
  duplicateCount: number;
  createdAt: string;
};
