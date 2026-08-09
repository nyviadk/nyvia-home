import { useState } from 'react';

import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { SPOTS } from '../spots';
import type { PlanioFalsePositive, PlanioLesson, PlanioRaw, PlanioSpot } from '../types';
import { BatchRow, BlockDetail, lessonBatches } from './archive/lesson-batches';
import { FalsePositiveItem, RawItem } from './archive/raw-item';
import { SpotSection } from './archive/spot-section';
import { RawDetail } from './raw-detail';

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
  // key: RawDetail seeder lokal state fra `raw` ved mount. Uden key genbruges komponenten
  // ved skift af openRawId → initialiseringerne kører ikke igen og forrige posts tekst bliver stående.
  if (openRaw) return <RawDetail key={openRaw.id} raw={openRaw} onBack={() => setOpenRawId(null)} />;

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
        <AppText variant="muted" className="text-[11px] uppercase">
          Rå feedback ({raw.length})
        </AppText>
        {raw.length ? (
          raw.map((r) => <RawItem key={r.id} raw={r} onOpen={() => setOpenRawId(r.id)} />)
        ) : (
          <AppText variant="muted" className="text-xs">
            Ingen rå feedback endnu.
          </AppText>
        )}
      </View>

      <View className="gap-2">
        <AppText variant="muted" className="text-[11px] uppercase">
          False positives ({falsePositives.length})
        </AppText>
        {falsePositives.length ? (
          falsePositives.map((fp) => <FalsePositiveItem key={fp.id} fp={fp} />)
        ) : (
          <AppText variant="muted" className="text-xs">
            Ingen gemte endnu — injiceres i Pass 1.
          </AppText>
        )}
      </View>
    </View>
  );
}
