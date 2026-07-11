import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { deleteHome } from '../data/homes.repository';
import { markPendingHomeDelete, unmarkPendingHomeDelete } from '../data/pending-deletes';

export function DeleteHomeLink({ id, label }: { id: string; label: string }) {
  return (
    <DeleteEntityLink
      label="Slet bolig"
      name={label}
      confirmMessage={`Vil du slette "${label}"? Flytte-data på boligen forbliver, men knyttes ikke længere til en synlig bolig.`}
      markPending={() => markPendingHomeDelete(id)}
      unmarkPending={() => unmarkPendingHomeDelete(id)}
      remove={() => deleteHome(id)}
    />
  );
}
