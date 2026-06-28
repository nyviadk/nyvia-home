import Papa from 'papaparse';
import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@/lib/datetime';
import { kronerToOre } from '@/lib/money';

/**
 * En rå banktransaktion læst fra Nykredit-CSV'en (før rense-regler og klassifikation).
 * Felter der er tomme i eksporten bliver null/tom streng.
 */
export interface RawTransaction {
  account: string;
  senderAccount: string;
  receiverAccount: string;
  date: string;
  text: string;
  amountOre: number;
  balanceOre: number | null;
  payer: string | null;
  counterparty: string | null;
  /** Kontohaver = ejeren af export-kontoen (dig). Bruges til at spotte selv-overførsler. */
  accountHolder: string | null;
  transferType: string | null;
}

/**
 * Parser Nykredit-CSV (semikolon eller tab — auto-detekteres) til rå transaktioner.
 * Kører 100% lokalt (PapaParse), ingen netværk. Rækker uden konto/dato springes over.
 */
export function parseNykreditCsv(content: string): RawTransaction[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    delimiter: '', // auto-detektér (; eller tab)
  });
  return (result.data ?? []).map(mapRow).filter((r): r is RawTransaction => r !== null);
}

function mapRow(row: Record<string, string>): RawTransaction | null {
  const get = makeGetter(row);
  const account = get('Exportkonto');
  const date = parseDanishDate(get('Dato'));
  if (!account || !date) return null; // header-rester / tomme linjer

  return {
    account,
    senderAccount: get('Afsenderkonto'),
    receiverAccount: get('Modtagerkonto'),
    date,
    text: get('Tekst'),
    amountOre: parseDanishAmountOre(get('Beløb')),
    balanceOre: parseOptionalAmountOre(get('Saldo')),
    payer: emptyToNull(get('Indbetaler')),
    counterparty: emptyToNull(get('Modtagernavn')),
    accountHolder: emptyToNull(get('Kontohaver')),
    transferType: emptyToNull(get('Ovf.type')),
  };
}

/** Case-/whitespace-tolerant kolonneopslag (header-navne kan variere lidt). */
function makeGetter(row: Record<string, string>) {
  const normalized = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    normalized.set(key.trim().toLowerCase(), (value ?? '').trim());
  }
  return (header: string): string => normalized.get(header.trim().toLowerCase()) ?? '';
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

function parseDanishDate(raw: string): string | null {
  if (!raw) return null;
  const dt = DateTime.fromFormat(raw, 'dd-MM-yyyy', { zone: APP_TIMEZONE });
  return dt.isValid ? dt.toISODate() : null;
}

/** "−68,95" / "1.234,56" → øre (med fortegn). Tom streng → 0. */
function parseDanishAmountOre(raw: string): number {
  if (!raw) return 0;
  const negative = /^[−-]/.test(raw.trim());
  const cleaned = raw
    .replace(/[−-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const ore = kronerToOre(cleaned);
  return negative ? -ore : ore;
}

function parseOptionalAmountOre(raw: string): number | null {
  return raw ? parseDanishAmountOre(raw) : null;
}
