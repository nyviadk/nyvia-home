import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { deleteBudgetEntry } from '../data/budget.repository';
import { markPendingBudgetDelete, unmarkPendingBudgetDelete } from '../data/pending-deletes';

export function DeleteBudgetLink({ id, name }: { id: string; name: string }) {
  return (
    <DeleteEntityLink
      label="Slet post"
      name={name}
      markPending={() => markPendingBudgetDelete(id)}
      unmarkPending={() => unmarkPendingBudgetDelete(id)}
      remove={() => deleteBudgetEntry(id)}
    />
  );
}
