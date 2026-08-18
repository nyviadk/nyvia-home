import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { type FilterChip, FilterChips } from '@/components/ui/filter-chips';
import { ListGate } from '@/components/ui/list-gate';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { View } from '@/tw';
import { EntryRow } from '../components/entry-row';
import { setKindFilter, useQuizStore, type KindFilter } from '../data/quiz-store';
import { useSpanishStore } from '../data/spanish-store';
import { SPANISH_KINDS } from '../types';

/** Oversigt over alt materiale, filtreret på type. Herfra starter man også testen. */
export function SpanishScreen() {
  const entries = useSpanishStore.useVisibleItems();
  const loading = useSpanishStore((s) => s.loading);
  const fromCache = useSpanishStore((s) => s.fromCache);
  const kind = useQuizStore((s) => s.kind);

  const count = (k: KindFilter) =>
    k === 'alle' ? entries.length : entries.filter((e) => e.kind === k).length;

  // Vis kun typer der faktisk findes noget af (+ "Alle"), så listen ikke fyldes med nuller.
  const chips: FilterChip<KindFilter>[] = [
    { key: 'alle', label: 'Alle', count: entries.length },
    ...SPANISH_KINDS.filter((k) => count(k.value) > 0).map((k) => ({
      key: k.value as KindFilter,
      label: k.label,
      count: count(k.value),
    })),
  ];
  const active = chips.some((c) => c.key === kind) ? kind : 'alle';
  const visible = active === 'alle' ? entries : entries.filter((e) => e.kind === active);

  return (
    <Screen>
      <ScreenHeader title="Spansk" addHref="/spansk/new">
        <Link href="/spansk/settings" asChild>
          <Button title="Stemme" variant="secondary" className="h-10 px-4" />
        </Link>
      </ScreenHeader>

      <OfflineNotice fromCache={fromCache} />

      {/* Uden for ScreenHeader: tre knapper på titel-rækken bliver for trangt på en telefon.
          Altid synlig — også når listen er tom, for dét er netop når man vil indsætte
          en hel liste frem for at taste den ind post for post. */}
      <Link href="/spansk/import" asChild>
        <Button title="📋 Indsæt hel liste" variant="ghost" className="self-start" />
      </Link>

      {entries.length > 0 ? (
        <>
          <Link href="/spansk/test" asChild>
            <Button title="Start test" className="h-12" />
          </Link>
          {chips.length > 2 ? (
            <FilterChips options={chips} value={active} onChange={setKindFilter} />
          ) : null}
        </>
      ) : null}

      <ListGate
        count={visible.length}
        loading={loading}
        empty={{
          title: 'Ingenting endnu',
          description: 'Tilføj dit første ord, din første sætning eller en grammatik-regel.',
        }}>
        <View className="gap-2">
          {visible.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </View>
      </ListGate>
    </Screen>
  );
}
