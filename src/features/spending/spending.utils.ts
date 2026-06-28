import type { WithId } from '@/lib/firebase';
import { type Classifiable, classifyKind } from './lib/classify';
import { applyScrub } from './lib/scrub';
import { type BankTransaction, type OwnAccount, type ScrubRule, type TransactionKind } from './types';

/**
 * Bygger en klassifikations-funktion ud fra de aktuelle konti. Manuel `kindOverride`
 * vinder; ellers beregnes intern/udgift/indtægt live — så nye/omdøbte konti slår
 * igennem bagud uden at ændre gemte data. Virker på både gemte transaktioner og
 * review-rækker (alt der er Classifiable + evt. kindOverride).
 */
export function makeClassifier(accounts: readonly OwnAccount[]) {
  const internalNumbers = new Set(
    accounts.filter((a) => a.internal).map((a) => a.number).filter(Boolean)
  );
  return (t: Classifiable & { kindOverride?: TransactionKind | null }): TransactionKind =>
    t.kindOverride ?? classifyKind(t, internalNumbers);
}

/** Tekst-felter med rense-regler anvendt (gemte data er rå → regler virker bagud). */
export interface DisplayFields {
  text: string;
  payer: string | null;
  counterparty: string | null;
}

export function scrubFields(
  t: Pick<BankTransaction, 'text' | 'payer' | 'counterparty'>,
  rules: readonly ScrubRule[]
): DisplayFields {
  return {
    text: applyScrub(t.text, rules, 'text') ?? '',
    payer: applyScrub(t.payer, rules, 'payer'),
    counterparty: applyScrub(t.counterparty, rules, 'counterparty'),
  };
}

/** ÅÅÅÅ-MM for en ISO-dato. */
export function ym(date: string): string {
  return date.slice(0, 7);
}

/** Visningsnavn for en konto (brugervalgt navn, ellers det fulde kontonummer). */
export function displayAccountName(account: string, accounts: readonly OwnAccount[]): string {
  const named = accounts.find((a) => a.number === account)?.name?.trim();
  return named ? named : `Konto ${account}`;
}

/** Unikke konto-numre der optræder i transaktionerne. */
export function accountNumbers(txns: readonly WithId<BankTransaction>[]): string[] {
  return Array.from(new Set(txns.map((t) => t.account)));
}

export interface MonthTotals {
  expenseOre: number;
  incomeOre: number;
}

/** Forbrug/indtægt pr. måned (interne overførsler tæller ikke med). Udgift som positivt tal. */
export function monthlyTotals(
  txns: readonly WithId<BankTransaction>[],
  accounts: readonly OwnAccount[]
): Map<string, MonthTotals> {
  const classify = makeClassifier(accounts);
  const map = new Map<string, MonthTotals>();
  for (const t of txns) {
    const kind = classify(t);
    if (kind === 'internal') continue;
    const key = ym(t.date);
    const cur = map.get(key) ?? { expenseOre: 0, incomeOre: 0 };
    if (kind === 'expense') cur.expenseOre += Math.abs(t.amountOre);
    else cur.incomeOre += t.amountOre;
    map.set(key, cur);
  }
  return map;
}

/** Samlet forbrug (positivt) i én måned for et sæt transaktioner. */
export function spendingInMonthOre(
  txns: readonly WithId<BankTransaction>[],
  month: string,
  accounts: readonly OwnAccount[]
): number {
  const classify = makeClassifier(accounts);
  return txns
    .filter((t) => classify(t) === 'expense' && ym(t.date) === month)
    .reduce((sum, t) => sum + Math.abs(t.amountOre), 0);
}
