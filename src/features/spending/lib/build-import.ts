import type { OwnAccount, TransactionKind } from '../types';
import { parseNykreditCsv } from './csv';
import { transactionId } from './transaction-id';

/** Det buildImportPreview behøver for at finde nye konti (egne konti fra store'en). */
export interface ImportContext {
  accounts: OwnAccount[];
}

/**
 * En transaktion klar til review (kan redigeres før import). Tekst-felterne er RÅ
 * (rense-regler anvendes ved visning). Klassifikationen beregnes også ved visning ud
 * fra de aktuelle konti; kun en evt. manuel `kindOverride` gemmes med.
 */
export interface ReviewRow {
  id: string;
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
  /** Manuel overstyring fra review (ellers beregnes klassifikationen live). */
  kindOverride?: TransactionKind;
  /** True hvis denne id allerede findes i databasen (tidligere importeret). */
  duplicate: boolean;
  /** Skal rækken skrives ved godkendelse? Default: kun nye. */
  include: boolean;
}

export interface ImportPreview {
  fileName: string;
  rows: ReviewRow[];
  total: number;
  duplicates: number;
  /** Konto-numre i filen der endnu ikke er navngivet/registreret. */
  newAccounts: string[];
}

/**
 * Bygger review-overblikket: parse → deterministisk id. Klassifikation og rense-regler
 * påføres ved visning (så de virker bagud). Dubletter inden for filen kollapses;
 * dubletter der allerede er i databasen markeres (default ikke medtaget). Ingen
 * DB-skrivning her — det sker først ved godkendelse.
 */
export function buildImportPreview(
  content: string,
  fileName: string,
  settings: ImportContext,
  existingIds: ReadonlySet<string>
): ImportPreview {
  const raw = parseNykreditCsv(content);
  const ownNumbers = new Set(settings.accounts.map((a) => a.number));

  const seen = new Set<string>();
  const rows: ReviewRow[] = [];
  for (const r of raw) {
    const id = transactionId(r);
    if (seen.has(id)) continue; // dublet i samme fil → kollaps
    seen.add(id);

    const duplicate = existingIds.has(id);
    rows.push({
      id,
      account: r.account,
      date: r.date,
      text: r.text,
      amountOre: r.amountOre,
      balanceOre: r.balanceOre,
      payer: r.payer,
      counterparty: r.counterparty,
      accountHolder: r.accountHolder,
      senderAccount: r.senderAccount || null,
      receiverAccount: r.receiverAccount || null,
      transferType: r.transferType,
      duplicate,
      include: !duplicate,
    });
  }

  // Fang ALLE kontonumre i filen (export-, afsender- og modtagerkonto) der ikke
  // allerede er registreret — så du kan navngive dem og markere dine egne som interne.
  const seenAccounts = new Set<string>();
  for (const r of rows) {
    for (const n of [r.account, r.senderAccount, r.receiverAccount]) {
      if (n && !ownNumbers.has(n)) seenAccounts.add(n);
    }
  }
  const newAccounts = Array.from(seenAccounts);

  return {
    fileName,
    rows,
    total: rows.length,
    duplicates: rows.filter((r) => r.duplicate).length,
    newAccounts,
  };
}
