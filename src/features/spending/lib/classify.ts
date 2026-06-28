import type { TransactionKind } from '../types';

/** Felterne der skal til for at klassificere — deles af rå CSV-rækker og gemte transaktioner. */
export type Classifiable = {
  account: string;
  senderAccount: string | null;
  receiverAccount: string | null;
  transferType: string | null;
  text: string;
  payer: string | null;
  counterparty: string | null;
  accountHolder: string | null;
  amountOre: number;
};

/** Modkonto-nummeret (den side der ikke er ens egen export-konto), eller '' hvis ukendt. */
export function otherAccount(r: Classifiable): string {
  if (r.senderAccount && r.senderAccount !== r.account) return r.senderAccount;
  if (r.receiverAccount && r.receiverAccount !== r.account) return r.receiverAccount;
  return '';
}

/**
 * Klassificér en transaktion. Intern hvis (1) modkontoens nummer er en af mine egne
 * (interne) konti, eller (2) det er en overførsel hvor modparten (Indbetaler/Modtagernavn)
 * er kontohaveren selv — dvs. en selv-overførsel, også når modkontonummeret mangler i
 * eksporten. Ellers udgift/indtægt efter fortegn. Køres ved visning (slår igennem bagud).
 */
export function classifyKind(
  r: Classifiable,
  internalNumbers: ReadonlySet<string>
): TransactionKind {
  const other = otherAccount(r);
  if (other && internalNumbers.has(other)) return 'internal';
  if (isSelfTransfer(r)) return 'internal';
  return r.amountOre < 0 ? 'expense' : 'income';
}

/** Overførsel hvor afsender/modtager-navnet indeholder kontohaverens eget navn. */
function isSelfTransfer(r: Classifiable): boolean {
  const holder = (r.accountHolder ?? '').trim().toLowerCase();
  if (!holder) return false;
  const isTransfer = (r.transferType ?? '').toLowerCase().includes('overførsel');
  if (!isTransfer) return false;
  const payer = (r.payer ?? '').toLowerCase();
  const counterparty = (r.counterparty ?? '').toLowerCase();
  return payer.includes(holder) || counterparty.includes(holder);
}
