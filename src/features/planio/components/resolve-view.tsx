import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { type FilterChip, FilterChips } from '@/components/ui/filter-chips';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { buildResolve } from '../prompts';
import type { PlanioRaw } from '../types';
import { PromptCard } from './prompt-card';

type FeatureGroup = {
  key: string;
  prodId: string;
  feature: string;
  /** Runder, ældste først (Runde 1 = første feedback). */
  rounds: WithId<PlanioRaw>[];
};

/** Gruppér rå feedback pr. (PROD-ID + feature). Kun entries med mindst ét af dem indgår. */
function groupByFeature(raw: WithId<PlanioRaw>[]): FeatureGroup[] {
  const map = new Map<string, FeatureGroup>();
  for (const r of raw) {
    const prodId = r.prodId?.trim() ?? '';
    const feature = r.feature?.trim() ?? '';
    if (!prodId && !feature) continue;
    const key = `${prodId}␞${feature}`;
    const g = map.get(key) ?? { key, prodId, feature, rounds: [] };
    g.rounds.push(r);
    map.set(key, g);
  }
  for (const g of map.values()) g.rounds.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return [...map.values()];
}

const groupTitle = (g: FeatureGroup) => g.feature || g.prodId;
const groupSub = (g: FeatureGroup) =>
  [g.feature ? g.prodId : '', `${g.rounds.length} runde${g.rounds.length === 1 ? '' : 'r'}`]
    .filter(Boolean)
    .join(' · ');

export function ResolveView({ raw }: { raw: WithId<PlanioRaw>[] }) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // 'all' = al feedback til featuren, ellers en runde-entry-id.
  const [roundSel, setRoundSel] = useState<string>('all');

  const groups = groupByFeature(raw);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? groups.filter((g) =>
        `${g.prodId} ${g.feature} ${g.rounds.map((r) => r.text).join(' ')}`.toLowerCase().includes(q),
      )
    : groups;
  const selected = selectedKey ? (groups.find((g) => g.key === selectedKey) ?? null) : null;

  const select = (key: string) => {
    setSelectedKey(key);
    setRoundSel('all');
  };

  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="heading">Fase 3 · Udbedring af mentor-feedback</AppText>
        <AppText variant="muted">
          Efter PR + konkret feedback. Find featuren, vælg al feedback eller en enkelt runde, og kopiér
          udbedrings-prompten til den Claude, der har koden.
        </AppText>
      </View>

      {selected ? (
        <ResolvePicked
          group={selected}
          roundSel={roundSel}
          onRoundSel={setRoundSel}
          onBack={() => setSelectedKey(null)}
        />
      ) : (
        <>
          <Input value={search} onChangeText={setSearch} placeholder="Søg feedback — tekst / PROD-ID / feature…" />
          {groups.length === 0 ? (
            <EmptyState
              title="Ingen feedback endnu"
              description="Indsæt rå feedback med PROD-ID + feature-navn på Indsæt-siden, så dukker featuren op her."
            />
          ) : filtered.length === 0 ? (
            <AppText variant="muted">Ingen match.</AppText>
          ) : (
            <View className="gap-2">
              {filtered.map((g) => (
                <Pressable key={g.key} accessibilityRole="button" onPress={() => select(g.key)}>
                  <Card className="flex-row items-center gap-3">
                    <View className="flex-1">
                      <AppText variant="label">{groupTitle(g)}</AppText>
                      <AppText variant="muted" className="text-xs">{groupSub(g)}</AppText>
                    </View>
                    <AppText variant="muted">›</AppText>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function ResolvePicked({
  group,
  roundSel,
  onRoundSel,
  onBack,
}: {
  group: FeatureGroup;
  roundSel: string;
  onRoundSel: (v: string) => void;
  onBack: () => void;
}) {
  const rounds = group.rounds;
  const chosen = roundSel === 'all' ? rounds : rounds.filter((r) => r.id === roundSel);
  const feedback = chosen
    .map((r) => {
      const idx = rounds.findIndex((x) => x.id === r.id);
      return `— Runde ${idx + 1} (${formatDateCopenhagen(r.createdAt)}) —\n${r.text}`;
    })
    .join('\n\n');

  const chips: FilterChip<string>[] = [
    { key: 'all', label: 'Al feedback', count: rounds.length },
    ...rounds.map((r, i) => ({ key: r.id, label: `Runde ${i + 1}` })),
  ];

  return (
    <View className="gap-3">
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onBack}>
        <AppText variant="muted">‹ skift feature</AppText>
      </Pressable>
      <View className="gap-0.5">
        <AppText variant="label" className="text-base">{groupTitle(group)}</AppText>
        {groupSub(group) ? <AppText variant="muted" className="text-xs">{groupSub(group)}</AppText> : null}
      </View>

      {rounds.length > 1 ? (
        <FilterChips options={chips} value={roundSel} onChange={onRoundSel} />
      ) : null}

      <PromptCard
        title="Udbedrings-prompt"
        sub={roundSel === 'all' ? `Al feedback (${rounds.length} runder)` : 'Én runde'}
        prompt={buildResolve({ prodId: group.prodId, feature: group.feature, feedback })}
      />
    </View>
  );
}
