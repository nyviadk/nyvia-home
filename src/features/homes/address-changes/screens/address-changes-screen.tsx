import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { type FilterChip, FilterChips } from '@/components/ui/filter-chips';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { toastAfter } from '@/lib/toast/notify';
import { Pressable, View } from '@/tw';
import { QuickAddRow } from '../../components/quick-add-row';
import { AddressChangeRow } from '../components/address-change-row';
import {
  createAddressChange,
  createAddressChanges,
  resetAddressChangeStatuses,
} from '../data/address-changes.repository';
import { useAddressChangesStore } from '../data/address-changes-store';
import { ADDRESS_CHANGE_PRESETS } from '../data/presets';
import { ADDRESS_CHANGE_STATUSES, type AddressChangeStatus } from '../types';

type StatusFilter = AddressChangeStatus | 'all';

export function AddressChangesScreen() {
  const all = useAddressChangesStore((s) => s.items);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [busy, setBusy] = useState(false);

  // Stabil rækkefølge (oprettelses-rækkefølge) → rækker hopper ikke når status ændres.
  const changes = [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const doneCount = changes.filter((c) => c.status === 'færdig').length;
  const canReset = changes.some((c) => c.status !== 'ikke_startet');

  // Filter-chips: kun statusser der faktisk findes i listen (+ "Alle").
  const statusCount = (s: AddressChangeStatus) => changes.filter((c) => c.status === s).length;
  const chipOptions: FilterChip<StatusFilter>[] = [
    { key: 'all', label: 'Alle', count: changes.length },
    ...ADDRESS_CHANGE_STATUSES.filter((s) => statusCount(s.value) > 0).map((s) => ({
      key: s.value,
      label: s.label,
      count: statusCount(s.value),
    })),
  ];
  const activeFilter = chipOptions.some((o) => o.key === statusFilter) ? statusFilter : 'all';

  const q = search.trim().toLowerCase();
  const visible = changes
    .filter((c) => activeFilter === 'all' || c.status === activeFilter)
    .filter((c) => !q || c.name.toLowerCase().includes(q));

  const existsByName = (n: string) =>
    changes.some((c) => c.name.toLowerCase() === n.trim().toLowerCase());

  async function add() {
    const n = name.trim();
    if (!n) return;
    setName('');
    if (existsByName(n)) {
      await toastAfter(Promise.resolve(), 'Findes allerede på listen');
      return;
    }
    await createAddressChange({ name: n, status: 'ikke_startet' });
  }

  async function addPresets() {
    const toAdd = ADDRESS_CHANGE_PRESETS.filter((n) => !existsByName(n));
    if (toAdd.length === 0) return;
    setBusy(true);
    try {
      await createAddressChanges(toAdd.map((name) => ({ name, status: 'ikke_startet' as const })));
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    const ok = await confirmAction(
      'Nulstil status',
      'Sæt alle tilbage til "ikke startet"? Listen beholdes, så den kan genbruges til næste flytning.',
      'Nulstil'
    );
    if (ok) await resetAddressChangeStatuses(changes.map((c) => c.id));
  }

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <AppText variant="title">Adresseændringer</AppText>
          <AppText variant="muted">
            På tværs af boliger
            {changes.length > 0 ? ` · ${doneCount} / ${changes.length} færdige` : ''}
          </AppText>
        </View>
        {canReset ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onReset}>
            <AppText className="text-sm text-primary">Nulstil</AppText>
          </Pressable>
        ) : null}
      </View>

      <QuickAddRow
        value={name}
        onChangeText={setName}
        onAdd={add}
        placeholder="Hvem skal have ny adresse?"
      />

      {changes.length === 0 ? (
        <>
          <EmptyState
            title="Ingen endnu"
            description="Tilføj selv, eller start med den typiske liste over hvem der skal have din nye adresse."
          />
          <Button
            title="Tilføj typisk liste"
            variant="secondary"
            loading={busy}
            onPress={addPresets}
          />
        </>
      ) : (
        <>
          <Input value={search} onChangeText={setSearch} placeholder="Søg i listen…" autoCapitalize="none" />
          {chipOptions.length > 2 ? (
            <FilterChips options={chipOptions} value={activeFilter} onChange={setStatusFilter} />
          ) : null}
          {visible.length === 0 ? (
            <AppText variant="muted">Ingen match.</AppText>
          ) : (
            <View className="gap-2">
              {visible.map((change, i) => (
                // Faldende zIndex (+ relative) → en åben dropdown lægger sig over
                // rækkerne nedenunder i stedet for at gemme sig bag dem.
                <View key={change.id} className="relative" style={{ zIndex: visible.length - i }}>
                  <AddressChangeRow change={change} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
