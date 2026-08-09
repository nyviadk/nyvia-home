import { useState } from 'react';

import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { Pressable, View } from '@/tw';
import { usePlanioLessonsStore } from '../../data/planio-stores';
import { deleteLesson, setLessonSpot } from '../../data/planio.repository';
import { SPOTS } from '../../spots';
import type { PlanioLesson, PlanioSpot } from '../../types';
import { WeightBadge } from '../weight-badge';

/** Én lektion i arkivet: vægt, tekst, fix — plus flyt-til-spot og slet. */
export function LessonItem({ lesson }: { lesson: WithId<PlanioLesson> }) {
  const [moving, setMoving] = useState(false);

  const onDelete = () =>
    void confirmDelete({
      title: 'Slet lektion',
      name: lesson.lesson,
      message: 'Fjern denne lektion fra din knowledgebase?',
      toast: 'Lektion slettet',
      markPending: () => usePlanioLessonsStore.pending.mark(lesson.id),
      unmarkPending: () => usePlanioLessonsStore.pending.unmark(lesson.id),
      remove: () => deleteLesson(lesson.id),
    });

  const move = async (spot: PlanioSpot) => {
    setMoving(false);
    if (spot !== lesson.spot) await setLessonSpot(lesson.id, spot);
  };

  return (
    <View className="border-l-2 border-border pl-3">
      <View className="flex-row items-center gap-2">
        <WeightBadge weight={lesson.weight} />
        {lesson.src ? (
          <AppText variant="muted" className="text-[10px]">
            {lesson.src}
          </AppText>
        ) : null}
        <View className="flex-1" />
        <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setMoving((m) => !m)}>
          <AppText className="text-xs text-fg-muted">flyt</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
          <AppText className="text-xs text-danger">slet</AppText>
        </Pressable>
      </View>
      <AppText className="mt-0.5">{lesson.lesson}</AppText>
      <AppText variant="muted" className="text-xs">
        → {lesson.fix}
      </AppText>
      {moving ? (
        <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
          <AppText variant="muted" className="text-[11px]">
            Flyt til:
          </AppText>
          {SPOTS.filter((s) => s.id !== lesson.spot).map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => move(s.id)}
              style={{ backgroundColor: s.bg }}
              className="rounded-full px-2.5 py-0.5">
              <AppText className="text-[11px]" style={{ color: s.accent }}>
                {s.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
