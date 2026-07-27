import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { ArchiveView } from '../components/archive-view';
import { InsertView } from '../components/insert-view';
import { PlanView } from '../components/plan-view';
import { ResolveView } from '../components/resolve-view';
import { ReviewView } from '../components/review-view';
import { SearchView } from '../components/search-view';
import {
  usePlanioFalsePositivesStore,
  usePlanioLessonsStore,
  usePlanioRawStore,
} from '../data/planio-stores';

type PlanioTab = 'review' | 'resolve' | 'insert' | 'plan' | 'archive';

const TAB_OPTIONS: { value: PlanioTab; label: string }[] = [
  { value: 'review', label: 'Review' },
  { value: 'resolve', label: 'Udbedring' },
  { value: 'insert', label: 'Indsæt' },
  { value: 'plan', label: 'Planlægning' },
  { value: 'archive', label: 'Arkiv' },
];

/**
 * "My Planio" — prompt-komponist + knowledgebase (web). Interne faner + global søgning.
 * Søgning eller fane-skift unmounter Review → scope ryddes (deler-samme-scope-semantikken).
 */
export function PlanioScreen() {
  const lessons = usePlanioLessonsStore((s) => s.items);
  const raw = usePlanioRawStore((s) => s.items);
  const falsePositives = usePlanioFalsePositivesStore((s) => s.items);
  const fromCache = usePlanioLessonsStore((s) => s.fromCache);
  const [tab, setTab] = useState<PlanioTab>('review');
  const [search, setSearch] = useState('');
  const q = search.trim();

  const fpTexts = falsePositives.map((fp) => fp.text);

  return (
    <Screen>
      <View className="gap-1">
        <AppText variant="title">My Planio</AppText>
        <AppText variant="muted">bedste prompts + jeg lærer</AppText>
      </View>

      <OfflineNotice fromCache={fromCache} />

      <Input value={search} onChangeText={setSearch} placeholder="Søg i al data — lektioner, rå feedback, false positives…" />

      {q ? (
        <SearchView q={q} lessons={lessons} raw={raw} falsePositives={falsePositives} />
      ) : (
        <>
          <Segmented<PlanioTab> value={tab} options={TAB_OPTIONS} onChange={setTab} />
          {tab === 'review' ? (
            <ReviewView lessons={lessons} falsePositives={fpTexts} />
          ) : tab === 'resolve' ? (
            <ResolveView raw={raw} />
          ) : tab === 'insert' ? (
            <InsertView lessons={lessons} raw={raw} existingFalsePositives={fpTexts} />
          ) : tab === 'plan' ? (
            <PlanView lessons={lessons} />
          ) : (
            <ArchiveView lessons={lessons} raw={raw} falsePositives={falsePositives} />
          )}
        </>
      )}
    </Screen>
  );
}
