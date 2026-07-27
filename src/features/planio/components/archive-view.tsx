import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { deleteFalsePositive, deleteLesson, deleteLessons } from '../data/planio.repository';
import { SPOTS, spotName } from '../spots';
import type { PlanioFalsePositive, PlanioLesson, PlanioRaw, PlanioSpot } from '../types';
import { RawDetail } from './raw-detail';
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

function RawItem({ raw, onOpen }: { raw: WithId<PlanioRaw>; onOpen: () => void }) {
  const meta = [raw.prodId, raw.feature].filter(Boolean).join(' · ') || raw.src;
  return (
    <Pressable accessibilityRole="button" onPress={onOpen}>
      <Card className="gap-0.5">
        {meta ? <AppText variant="muted" className="text-[10px]">{meta}</AppText> : null}
        <AppText className="text-sm" numberOfLines={2}>{raw.text}</AppText>
      </Card>
    </Pressable>
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

type LessonBatch = { batchId: string; ids: string[]; createdAt: string; spots: Set<PlanioSpot> };

/** Grupper lektioner efter indsættelse (batchId). Kun blokke med 2+ (én kan slettes individuelt). */
function lessonBatches(lessons: WithId<PlanioLesson>[]): LessonBatch[] {
  const map = new Map<string, LessonBatch>();
  for (const l of lessons) {
    if (!l.batchId) continue;
    const b =
      map.get(l.batchId) ??
      { batchId: l.batchId, ids: [], createdAt: l.createdAt, spots: new Set<PlanioSpot>() };
    b.ids.push(l.id);
    b.spots.add(l.spot);
    map.set(l.batchId, b);
  }
  return [...map.values()]
    .filter((b) => b.ids.length >= 2)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function BatchRow({ batch }: { batch: LessonBatch }) {
  const onDelete = async () => {
    if (
      await confirmAction(
        'Slet blok',
        `Slet alle ${batch.ids.length} lektioner fra denne indsættelse?`,
        'Slet',
      )
    ) {
      await deleteLessons(batch.ids);
    }
  };
  return (
    <Card className="flex-row items-center gap-3">
      <View className="flex-1">
        <AppText variant="label">{batch.ids.length} lektioner</AppText>
        <AppText variant="muted" className="text-xs">
          {formatDateTimeCopenhagen(batch.createdAt)} · {[...batch.spots].map(spotName).join(', ')}
        </AppText>
      </View>
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
        <AppText className="text-sm text-danger">Slet blok</AppText>
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
  const [openRawId, setOpenRawId] = useState<string | null>(null);

  const openRaw = openRawId ? (raw.find((r) => r.id === openRawId) ?? null) : null;
  if (openRaw) return <RawDetail raw={openRaw} onBack={() => setOpenRawId(null)} />;

  const batches = lessonBatches(lessons);

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

      {batches.length ? (
        <View className="gap-2">
          <AppText variant="muted" className="text-[11px] uppercase">
            Indsatte blokke ({batches.length})
          </AppText>
          <AppText variant="muted" className="text-xs">
            Slet en hel indsættelse på én gang (fx et helt review du vil køre om).
          </AppText>
          {batches.map((b) => (
            <BatchRow key={b.batchId} batch={b} />
          ))}
        </View>
      ) : null}

      <View className="gap-2">
        <AppText variant="muted" className="text-[11px] uppercase">Rå feedback ({raw.length})</AppText>
        {raw.length ? (
          raw.map((r) => <RawItem key={r.id} raw={r} onOpen={() => setOpenRawId(r.id)} />)
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
