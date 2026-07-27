import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { deleteFalsePositive, deleteLesson, deleteRaw } from '../data/planio.repository';
import { SPOTS } from '../spots';
import type { PlanioFalsePositive, PlanioLesson, PlanioRaw, PlanioSpot } from '../types';
import { WeightBadge } from './weight-badge';

function LessonItem({ lesson }: { lesson: WithId<PlanioLesson> }) {
  const onDelete = async () => {
    if (await confirmAction('Slet lektion', 'Fjern denne lektion fra din knowledgebase?', 'Slet')) {
      await deleteLesson(lesson.id);
    }
  };
  return (
    <View className="border-l-2 border-border pl-3">
      <View className="flex-row items-center gap-2">
        <WeightBadge weight={lesson.weight} />
        {lesson.src ? <AppText variant="muted" className="text-[10px]">{lesson.src}</AppText> : null}
        <View className="flex-1" />
        <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
          <AppText className="text-xs text-danger">slet</AppText>
        </Pressable>
      </View>
      <AppText className="mt-0.5">{lesson.lesson}</AppText>
      <AppText variant="muted" className="text-xs">→ {lesson.fix}</AppText>
    </View>
  );
}

function SpotSection({
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
          <AppText variant="muted" className="text-[11px]">{ls.length} lektioner</AppText>
        </View>
        <AppText variant="muted">{open ? '▾' : '▸'}</AppText>
      </Pressable>
      {open ? (
        <View className="gap-2.5 border-t border-border px-4 py-3">
          {ls.length ? (
            ls.map((l) => <LessonItem key={l.id} lesson={l} />)
          ) : (
            <AppText variant="muted" className="text-xs">Ingen endnu.</AppText>
          )}
        </View>
      ) : null}
    </Card>
  );
}

function RawItem({ raw }: { raw: WithId<PlanioRaw> }) {
  const meta = [raw.prodId, raw.feature].filter(Boolean).join(' · ') || raw.src;
  const onDelete = async () => {
    if (await confirmAction('Slet', 'Fjern denne rå feedback fra arkivet?', 'Slet')) {
      await deleteRaw(raw.id);
    }
  };
  return (
    <Card className="flex-row items-start gap-3 py-3">
      <View className="flex-1">
        {meta ? <AppText variant="muted" className="mb-0.5 text-[10px]">{meta}</AppText> : null}
        <AppText className="text-sm">{raw.text}</AppText>
      </View>
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
        <AppText className="text-xs text-danger">slet</AppText>
      </Pressable>
    </Card>
  );
}

function FalsePositiveItem({ fp }: { fp: WithId<PlanioFalsePositive> }) {
  const onDelete = async () => {
    if (await confirmAction('Slet', 'Fjern denne false positive?', 'Slet')) {
      await deleteFalsePositive(fp.id);
    }
  };
  return (
    <Card className="flex-row items-start gap-3 py-3">
      <AppText className="flex-1 text-sm">{fp.text}</AppText>
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
        <AppText className="text-xs text-danger">slet</AppText>
      </Pressable>
    </Card>
  );
}

/** Docs for mig — al data, søgbar. Blinde vinkler + lektioner + rå feedback + false positives. */
export function ArchiveView({
  lessons,
  raw,
  falsePositives,
}: {
  lessons: WithId<PlanioLesson>[];
  raw: WithId<PlanioRaw>[];
  falsePositives: WithId<PlanioFalsePositive>[];
}) {
  const [open, setOpen] = useState<PlanioSpot | null>('scale');

  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="heading">Arkiv</AppText>
        <AppText variant="muted">
          Vægt (kritisk/tilbagevendende) afgør, hvad Pass 2 og plan-tjek injicerer.
        </AppText>
      </View>

      <View className="gap-2">
        {SPOTS.map((s) => (
          <SpotSection
            key={s.id}
            spot={s}
            lessons={lessons}
            open={open === s.id}
            onToggle={() => setOpen(open === s.id ? null : s.id)}
          />
        ))}
      </View>

      <View className="gap-2">
        <AppText variant="muted" className="text-[11px] uppercase">Rå feedback ({raw.length})</AppText>
        {raw.length ? (
          raw.map((r) => <RawItem key={r.id} raw={r} />)
        ) : (
          <AppText variant="muted" className="text-xs">Ingen rå feedback endnu.</AppText>
        )}
      </View>

      <View className="gap-2">
        <AppText variant="muted" className="text-[11px] uppercase">
          False positives ({falsePositives.length})
        </AppText>
        {falsePositives.length ? (
          falsePositives.map((fp) => <FalsePositiveItem key={fp.id} fp={fp} />)
        ) : (
          <AppText variant="muted" className="text-xs">Ingen gemte endnu — injiceres i Pass 1.</AppText>
        )}
      </View>
    </View>
  );
}
