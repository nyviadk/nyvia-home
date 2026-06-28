import { nowISO } from '@/lib/datetime';
import {
  auth,
  type BatchOp,
  type CollectionSnapshot,
  db,
  type Unsubscribe,
  type WithId,
} from '@/lib/firebase';
import type { ReviewRow } from '../lib/build-import';
import type { BankTransaction, TransactionKind } from '../types';

/** Kaldes løbende under batch-skrivning så UI kan vise fremdrift. */
export type ProgressCallback = (done: number, total: number) => void;

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const collPath = () => `users/${requireUid()}/transactions`;
const docPath = (id: string) => `${collPath()}/${id}`;

export function subscribeTransactions(
  onChange: (snap: CollectionSnapshot<BankTransaction>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<BankTransaction>(
    collPath(),
    { orderByField: 'date', orderDirection: 'desc' },
    onChange,
    onError
  );
}

/**
 * Skriver de medtagne review-rækker med deterministisk id i batches (≤450 pr. commit,
 * ét netværkskald pr. batch). setDoc/merge → idempotent, gen-import overskriver i
 * stedet for at duplikere. Klassifikationen beregnes ved visning, så kun en evt.
 * manuel `kindOverride` skrives med.
 */
export async function importTransactions(
  rows: ReviewRow[],
  batchId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  const now = nowISO();
  const ops: BatchOp[] = rows.map((row) => ({
    type: 'set',
    path: docPath(row.id),
    data: toDoc(row, batchId, now),
    merge: true,
  }));
  await db.commitBatch(ops, onProgress);
}

function toDoc(row: ReviewRow, batchId: string, now: string): BankTransaction {
  const doc: BankTransaction = {
    account: row.account,
    date: row.date,
    text: row.text,
    amountOre: row.amountOre,
    balanceOre: row.balanceOre,
    payer: row.payer,
    counterparty: row.counterparty,
    accountHolder: row.accountHolder,
    senderAccount: row.senderAccount,
    receiverAccount: row.receiverAccount,
    transferType: row.transferType,
    importBatchId: batchId,
    importedAt: now,
    updatedAt: now,
  };
  if (row.kindOverride) doc.kindOverride = row.kindOverride;
  return doc;
}

/** Sæt manuel klassifikation, eller null for at vende tilbage til den automatiske. */
export function setTransactionKindOverride(
  id: string,
  kind: TransactionKind | null
): Promise<void> {
  return db.updateDoc(docPath(id), { kindOverride: kind, updatedAt: nowISO() });
}

/** Sletter en enkelt transaktion. */
export function deleteTransaction(id: string): Promise<void> {
  return db.deleteDoc(docPath(id));
}

/** Sletter alle transaktioner der aktuelt ejes af et import-batch (i batches, ingen ekstra reads). */
export async function deleteTransactionsOfBatch(
  txns: WithId<BankTransaction>[],
  batchId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  const ops: BatchOp[] = txns
    .filter((t) => t.importBatchId === batchId)
    .map((t) => ({ type: 'delete', path: docPath(t.id) }));
  await db.commitBatch(ops, onProgress);
}
