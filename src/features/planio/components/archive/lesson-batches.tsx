import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { Pressable, View } from '@/tw';
import { usePlanioLessonsStore } from '../../data/planio-stores';
import { deleteLessons } from '../../data/planio.repository';
import { spotName } from '../../spots';
import type { PlanioLesson, PlanioSpot } from '../../types';
import { LessonItem } from './lesson-item';

export type LessonBatch = {
  batchId: string;
  ids: string[];
  createdAt: string;
  spots: Set<PlanioSpot>;
};

/** Grupper lektioner efter indsættelse (batchId). Kun blokke med 2+ (én kan slettes individuelt). */
export function lessonBatches(lessons: WithId<PlanioLesson>[]): LessonBatch[] {
  const map = new Map<string, LessonBatch>();
  for (const l of lessons) {
    if (!l.batchId) continue;
    const b = map.get(l.batchId) ?? {
      batchId: l.batchId,
      ids: [],
      createdAt: l.createdAt,
      spots: new Set<PlanioSpot>(),
    };
    b.ids.push(l.id);
    b.spots.add(l.spot);
    map.set(l.batchId, b);
  }
  return [...map.values()]
    .filter((b) => b.ids.length >= 2)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function BatchRow({ batch, onOpen }: { batch: LessonBatch; onOpen: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpen}>
      <Card className="flex-row items-center gap-3">
        <View className="flex-1">
          <AppText variant="label">{batch.ids.length} lektioner</AppText>
          <AppText variant="muted" className="text-xs">
            {formatDateTimeCopenhagen(batch.createdAt)} · {[...batch.spots].map(spotName).join(', ')}
          </AppText>
        </View>
        <AppText variant="muted">›</AppText>
      </Card>
    </Pressable>
  );
}

/** Detalje for én indsat blok: se de enkelte lektioner (hver kan slettes) + slet hele blokken. */
export function BlockDetail({
  lessons,
  onBack,
}: {
  lessons: WithId<PlanioLesson>[];
  onBack: () => void;
}) {
  const ids = lessons.map((l) => l.id);
  const spots = new Set(lessons.map((l) => l.spot));

  // Hele blokken skjules på én gang, så listen ikke tømmes lektion for lektion under fortryd-vinduet.
  const onDeleteAll = () =>
    void confirmDelete({
      title: 'Slet blok',
      name: `${ids.length} lektioner`,
      message: `Slet alle ${ids.length} lektioner fra denne indsættelse?`,
      toast: `${ids.length} lektioner slettet`,
      markPending: () => usePlanioLessonsStore.pending.mark(ids),
      unmarkPending: () => usePlanioLessonsStore.pending.unmark(ids),
      remove: () => deleteLessons(ids),
      after: onBack,
    });

  return (
    <View className="gap-3">
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onBack}>
        <AppText variant="muted">‹ tilbage til arkiv</AppText>
      </Pressable>
      <View className="gap-0.5">
        <AppText variant="label" className="text-base">
          {ids.length} lektioner
        </AppText>
        <AppText variant="muted" className="text-[11px]">
          {formatDateTimeCopenhagen(lessons[0].createdAt)} · {[...spots].map(spotName).join(', ')}
        </AppText>
      </View>
      <View className="gap-2.5">
        {lessons.map((l) => (
          <LessonItem key={l.id} lesson={l} />
        ))}
      </View>
      <View className="flex-row border-t border-border pt-3">
        <Pressable accessibilityRole="button" hitSlop={6} onPress={onDeleteAll}>
          <AppText className="text-sm text-danger">Slet hele blokken</AppText>
        </Pressable>
      </View>
    </View>
  );
}
