import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import type { SPOTS } from '../../spots';
import type { PlanioLesson } from '../../types';
import { LessonItem } from './lesson-item';

/** Én blind vinkel som sammenklappelig sektion med sine lektioner. */
export function SpotSection({
  spot,
  lessons,
  open,
  onToggle,
}: {
  spot: (typeof SPOTS)[number];
  lessons: WithId<PlanioLesson>[];
  open: boolean;
  onToggle: () => void;
}) {
  const ls = lessons.filter((l) => l.spot === spot.id);
  return (
    <Card className="gap-0 p-0">
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        className="flex-row items-center gap-3 p-4">
        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: spot.accent }} />
        <View className="flex-1">
          <AppText variant="label" style={{ color: spot.accent }}>
            {spot.name} <AppText variant="muted">· {spot.tag}</AppText>
          </AppText>
        </View>
        <View className="rounded-md bg-element px-2 py-0.5">
          <AppText variant="muted" className="text-[11px]">
            {ls.length} lektioner
          </AppText>
        </View>
        <AppText variant="muted">{open ? '▾' : '▸'}</AppText>
      </Pressable>
      {open ? (
        <View className="gap-2.5 border-t border-border px-4 py-3">
          {ls.length ? (
            ls.map((l) => <LessonItem key={l.id} lesson={l} />)
          ) : (
            <AppText variant="muted" className="text-xs">
              Ingen endnu.
            </AppText>
          )}
        </View>
      ) : null}
    </Card>
  );
}
