import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe, type WithId } from '@/lib/firebase';
import type { ReviewRow } from '../lib/build-import';
import type { BankTransaction, TransactionKind } from '../types';

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
 * Skriver de medtagne review-rækker med deterministisk id (setDoc/merge → idempotent,
 * gen-import overskriver i stedet for at duplikere). Klassifikationen beregnes ved
 * visning, så kun en evt. manuel `kindOverride` skrives med.
 */
export async function importTransactions(rows: ReviewRow[], batchId: string): Promise<void> {
  const now = nowISO();
  await Promise.all(
    rows.map((row) => db.setDoc<BankTransaction>(docPath(row.id), toDoc(row, batchId, now), true))
  );
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

export function setTransactionKindOverride(id: string, kind: TransactionKind): Promise<void> {
  return db.updateDoc(docPath(id), { kindOverride: kind, updatedAt: nowISO() });
}

/** Sletter alle transaktioner der aktuelt ejes af et import-batch (ingen ekstra reads). */
export async function deleteTransactionsOfBatch(
  txns: WithId<BankTransaction>[],
  batchId: string
): Promise<void> {
  const ids = txns.filter((t) => t.importBatchId === batchId).map((t) => t.id);
  await Promise.all(ids.map((id) => db.deleteDoc(docPath(id))));
}
