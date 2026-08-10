import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { StatRow } from '@/components/ui/stat-row';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { QuizCard } from '../components/quiz-card';
import {
  advance,
  endRound,
  setDirection,
  setKindFilter,
  startRound,
  useQuizStore,
  type KindFilter,
} from '../data/quiz-store';
import { useSpanishStore } from '../data/spanish-store';
import { QUIZ_DIRECTIONS, SPANISH_KINDS, type QuizDirection } from '../types';

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  ...SPANISH_KINDS.map((k) => ({ value: k.value as KindFilter, label: k.label })),
];

export function QuizScreen() {
  const entries = useSpanishStore.useVisibleItems();
  const queue = useQuizStore((s) => s.queue);
  const direction = useQuizStore((s) => s.direction);
  const kind = useQuizStore((s) => s.kind);
  const roundTotal = useQuizStore((s) => s.roundTotal);
  const correct = useQuizStore((s) => s.correct);
  const wrong = useQuizStore((s) => s.wrong);

  const pool = kind === 'alle' ? entries : entries.filter((e) => e.kind === kind);

  // Kort der stadig findes. Slettes en post midt i en runde, ryger den bare ud af køen
  // i stedet for at blokere resten af runden.
  const byId = new Map(entries.map((e) => [e.id, e]));
  const remaining = queue.map((id) => byId.get(id)).filter((e) => e !== undefined);
  const current = remaining[0];

  const done = roundTotal > 0 && remaining.length === 0;

  if (current) {
    const answered = roundTotal - remaining.length;
    return (
      <Screen>
        <View className="gap-2">
          <View className="flex-row items-baseline justify-between">
            <AppText variant="title">Test</AppText>
            <AppText variant="muted">
              {answered + 1} / {roundTotal}
            </AppText>
          </View>
          <ProgressBar value={roundTotal ? answered / roundTotal : 0} />
        </View>

        {/* key: nulstiller svarfelt + facit-tilstand ved skift til næste kort. */}
        <QuizCard
          key={current.id}
          entry={current}
          direction={direction}
          onNext={(result) => advance(current.id, result)}
        />

        <View className="items-center pt-2">
          <Button
            title="Afslut runde"
            variant="ghost"
            onPress={() => {
              endRound();
              router.back();
            }}
          />
        </View>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <AppText variant="title">Runde færdig</AppText>
        <Card className="gap-2">
          <StatRow label="Kort i runden">{String(roundTotal)}</StatRow>
          <StatRow label="Rigtige">{String(correct)}</StatRow>
          <StatRow label="Forkerte">{String(wrong)}</StatRow>
        </Card>
        <AppText variant="muted">
          Alle kort i udvalget har været vist én gang. Næste runde blander på ny.
        </AppText>
        <Button title="Ny runde" onPress={() => startRound(pool.map((e) => e.id))} />
        <Button
          title="Tilbage"
          variant="secondary"
          onPress={() => {
            endRound();
            router.back();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Test</AppText>

      <View className="gap-2">
        <AppText variant="label">Retning</AppText>
        <Segmented<QuizDirection>
          value={direction}
          options={QUIZ_DIRECTIONS}
          onChange={setDirection}
        />
        <AppText variant="muted">
          Blandet vælger retning pr. kort — det samme kort får dog altid samme retning.
        </AppText>
      </View>

      <View className="gap-2">
        <AppText variant="label">Materiale</AppText>
        <Segmented<KindFilter> value={kind} options={KIND_OPTIONS} onChange={setKindFilter} />
        <AppText variant="muted">
          Regler har ikke ét svar man kan skrive — du får overskriften, svarer i hovedet og
          trykker “Vis forklaring”. De tæller ikke i resultatet.
        </AppText>
      </View>

      {pool.length === 0 ? (
        <EmptyState
          title="Intet at teste"
          description="Der er ingen poster af den valgte type endnu."
        />
      ) : (
        <Button
          title={`Start runde (${pool.length} kort)`}
          className="h-12"
          onPress={() => startRound(pool.map((e) => e.id))}
        />
      )}
    </Screen>
  );
}
