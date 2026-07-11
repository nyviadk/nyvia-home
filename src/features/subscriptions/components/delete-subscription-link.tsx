import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { deleteSubscription } from '../data/subscriptions.repository';
import {
  markPendingSubscriptionDelete,
  unmarkPendingSubscriptionDelete,
} from '../data/pending-deletes';

export function DeleteSubscriptionLink({ id, name }: { id: string; name: string }) {
  return (
    <DeleteEntityLink
      label="Slet abonnement"
      name={name}
      markPending={() => markPendingSubscriptionDelete(id)}
      unmarkPending={() => unmarkPendingSubscriptionDelete(id)}
      remove={() => deleteSubscription(id)}
    />
  );
}
