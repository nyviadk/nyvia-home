import { useState } from 'react';
import { Link, useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { CustomerListItem } from '../components/customer-list-item';
import { createEviCustomer } from '../data/evi-customers.repository';
import { useEviCustomersStore } from '../data/evi-customers-store';
import { useEviPendingDeletes } from '../data/evi-pending-deletes';
import { useEviTemplateStore } from '../data/evi-template-store';
import { formatAnswerText } from '../format';
import type { EviCustomer, EviField } from '../types';

function subtitleFor(fields: EviField[], customer: WithId<EviCustomer>): string {
  return fields
    .filter((f) => f.pinned && !f.archived && f.type !== 'sensitive')
    .map((f) => formatAnswerText(f, customer.answers?.[f.id]))
    .filter((s) => s !== '')
    .slice(0, 2)
    .join(' · ');
}

export function EviCustomersScreen() {
  const router = useRouter();
  const customers = useEviCustomersStore((s) => s.items);
  const loading = useEviCustomersStore((s) => s.loading);
  const fromCache = useEviCustomersStore((s) => s.fromCache);
  const fields = useEviTemplateStore((s) => s.fields);
  const pendingIds = useEviPendingDeletes((s) => s.ids);

  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const create = async () => {
    const trimmed = name.trim();
    if (trimmed === '' || creating) return;
    setCreating(true);
    try {
      const id = await createEviCustomer(trimmed);
      setName('');
      router.push({ pathname: '/evi/[id]', params: { id } });
    } finally {
      setCreating(false);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = customers
    .filter((c) => !pendingIds.has(c.id))
    .map((c) => ({ c, subtitle: subtitleFor(fields, c) }))
    .filter(({ c, subtitle }) =>
      q === '' ? true : `${c.companyName} ${subtitle}`.toLowerCase().includes(q),
    );

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">Evi</AppText>
        <Link href="/evi/template" asChild>
          <Button title="Skabelon" variant="secondary" className="h-10 px-4" />
        </Link>
      </View>

      <OfflineNotice fromCache={fromCache} />

      <View className="flex-row items-center gap-2">
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Nyt kundenavn (firmanavn)"
          className="flex-1"
          returnKeyType="done"
          onSubmitEditing={() => void create()}
        />
        <Button title="Opret" className="h-12 px-5" loading={creating} onPress={() => void create()} />
      </View>

      {customers.length > 5 ? (
        <Input value={query} onChangeText={setQuery} placeholder="Søg kunde" autoCapitalize="none" />
      ) : null}

      {visible.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen kunder endnu"
            description="Opret din første kunde ovenfor. Felterne styres i skabelonen."
          />
        )
      ) : (
        <View className="gap-2">
          {visible.map(({ c, subtitle }) => (
            <CustomerListItem key={c.id} customer={c} subtitle={subtitle} />
          ))}
        </View>
      )}
    </Screen>
  );
}
