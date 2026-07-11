import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { deleteLoan } from '../data/loans.repository';
import { markPendingDelete, unmarkPendingDelete } from '../data/pending-deletes';

export function DeleteLoanLink({ id, name }: { id: string; name: string }) {
  return (
    <DeleteEntityLink
      label="Slet lån"
      name={name}
      markPending={() => markPendingDelete(id)}
      unmarkPending={() => unmarkPendingDelete(id)}
      remove={() => deleteLoan(id)}
    />
  );
}
