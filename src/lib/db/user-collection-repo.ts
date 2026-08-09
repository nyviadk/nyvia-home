import { nowISO } from '@/lib/datetime';
import { type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { requireUid } from '@/lib/firebase/require-uid';
import { toastAfter } from '@/lib/toast/notify';

/**
 * CRUD-skelettet for en bruger-scoped Firestore-kollektion (`users/{uid}/<navn>`).
 *
 * Hver feature skrev før de samme fire funktioner selv — subscribe/create/update/delete plus
 * `requireUid` og et sti-par — med kun kollektionsnavnet og toast-teksten til forskel.
 * Feature-specifikke skrivninger (fx `addPayment`, `importTransactions`) bliver stående i
 * deres eget repository og bruger `collPath`/`docPath` herfra.
 *
 * Sletning toaster bevidst ikke: det håndteres af fortryd-flowet (`confirmDelete`).
 */
export function createUserCollectionRepo<Doc extends Record<string, unknown>, Input>(opts: {
  /** Kollektionsnavnet under `users/{uid}/` — fx 'homes'. */
  collection: string;
  orderBy?: { field: string; direction?: 'asc' | 'desc' };
  /** Toast ved oprettelse, fx 'Bolig oprettet'. `null` opretter tavst (bulk/implicit). */
  createdToast: string | null;
  /** Toast ved opdatering. Default 'Gemt'. */
  updatedToast?: string;
}) {
  const collPath = () => `users/${requireUid()}/${opts.collection}`;
  const docPath = (id: string) => `${collPath()}/${id}`;
  const updated = opts.updatedToast ?? 'Gemt';

  return {
    collPath,
    docPath,

    subscribe(
      onChange: (snap: CollectionSnapshot<Doc>) => void,
      onError?: (e: Error) => void
    ): Unsubscribe {
      return db.subscribeCollection<Doc>(
        collPath(),
        opts.orderBy
          ? { orderByField: opts.orderBy.field, orderDirection: opts.orderBy.direction ?? 'asc' }
          : {},
        onChange,
        onError
      );
    },

    create(input: Input): Promise<string> {
      const now = nowISO();
      const write = db.addDoc(collPath(), { ...input, createdAt: now, updatedAt: now });
      return opts.createdToast === null ? write : toastAfter(write, opts.createdToast);
    },

    update(id: string, input: Input): Promise<void> {
      return toastAfter(db.updateDoc(docPath(id), { ...input, updatedAt: nowISO() }), updated);
    },

    /** Sæt enkelte felter uden at røre resten. `toast: null` gemmer uden kvittering. */
    patch(
      id: string,
      fields: Record<string, unknown>,
      toast: string | null = updated
    ): Promise<void> {
      const write = db.updateDoc(docPath(id), { ...fields, updatedAt: nowISO() });
      return toast === null ? write : toastAfter(write, toast);
    },

    remove(id: string): Promise<void> {
      return db.deleteDoc(docPath(id));
    },
  };
}
