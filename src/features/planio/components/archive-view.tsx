import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { deleteFalsePositive, deleteLesson, deleteLessons, setLessonSpot } from '../data/planio.repository';
import { SPOTS, spotName } from '../spots';
import type { PlanioFalsePositive, PlanioLesson, PlanioRaw, PlanioSpot } from '../types';
import { RawDetail } from './raw-detail';
import { WeightBadge } from './weight-badge';

function LessonItem({ lesson }: { lesson: WithId<PlanioLesson> }) {
  const [moving, setMoving] = useState(false);
  const onDelete = async () => {
    if (await confirmAction('Slet lektion', 'Fjern denne lektion fra din knowledgebase?', 'Slet')) {
      await deleteLesson(lesson.id);
    }
  };
  const move = async (spot: PlanioSpot) => {
    setMoving(false);
    if (spot !== lesson.spot) await setLessonSpot(lesson.id, spot);
  };
  return (
    <View className="border-l-2 border-border pl-3">
      <View className="flex-row items-center gap-2">
        <WeightBadge weight={lesson.weight} />
        {lesson.src ? <AppText variant="muted" className="text-[10px]">{lesson.src}</AppText> : null}
        <View className="flex-1" />
        <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setMoving((m) => !m)}>
          <AppText className="text-xs text-fg-muted">flyt</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
          <AppText className="text-xs text-danger">slet</AppText>
        </Pressable>
      </View>
      <AppText className="mt-0.5">{lesson.lesson}</AppText>
      <AppText variant="muted" className="text-xs">→ {lesson.fix}</AppText>
      {moving ? (
        <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
          <AppText variant="muted" className="text-[11px]">Flyt til:</AppText>
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

function BatchRow({ batch, onOpen }: { batch: LessonBatch; onOpen: () => void }) {
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
function BlockDetail({ lessons, onBack }: { lessons: WithId<PlanioLesson>[]; onBack: () => void }) {
  const ids = lessons.map((l) => l.id);
  const spots = new Set(lessons.map((l) => l.spot));
  const onDeleteAll = async () => {
    if (
      await confirmAction('Slet blok', `Slet alle ${ids.length} lektioner fra denne indsættelse?`, 'Slet')
    ) {
      await deleteLessons(ids);
      onBack();
    }
  };
  return (
    <View className="gap-3">
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onBack}>
        <AppText variant="muted">‹ tilbage til arkiv</AppText>
      </Pressable>
      <View className="gap-0.5">
        <AppText variant="label" className="text-base">{ids.length} lektioner</AppText>
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
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);

  const openRaw = openRawId ? (raw.find((r) => r.id === openRawId) ?? null) : null;
  if (openRaw) return <RawDetail raw={openRaw} onBack={() => setOpenRawId(null)} />;

  const openBatchLessons = openBatchId ? lessons.filter((l) => l.batchId === openBatchId) : [];
  if (openBatchId && openBatchLessons.length) {
    return <BlockDetail lessons={openBatchLessons} onBack={() => setOpenBatchId(null)} />;
  }

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
            Klik ind for at se de enkelte lektioner, eller slet en hel indsættelse på én gang.
          </AppText>
          {batches.map((b) => (
            <BatchRow key={b.batchId} batch={b} onOpen={() => setOpenBatchId(b.batchId)} />
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
