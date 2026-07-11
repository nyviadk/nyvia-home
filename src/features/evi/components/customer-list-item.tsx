import { Link } from 'expo-router';

import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable } from '@/tw';
import type { EviCustomer } from '../types';

/** Én kunde i listen: firmanavn + kort undertekst af nøgle-info. */
export function CustomerListItem({
  customer,
  subtitle,
}: {
  customer: WithId<EviCustomer>;
  subtitle: string;
}) {
  return (
    <Link href={{ pathname: '/evi/[id]', params: { id: customer.id } }} asChild>
      <Pressable
        style={{ borderCurve: 'continuous', boxShadow: '0 1px 2px rgba(40, 40, 38, 0.05)' }}
        className="gap-0.5 rounded-2xl border border-border bg-card px-4 py-3 hover:bg-element active:bg-selected">
        <AppText variant="heading">{customer.companyName || 'Uden navn'}</AppText>
        {subtitle ? (
          <AppText variant="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </Pressable>
    </Link>
  );
}
