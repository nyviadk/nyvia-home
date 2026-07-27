import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { spotConfig } from '../spots';
import type { PlanioFalsePositive, PlanioLesson, PlanioRaw } from '../types';

/** Global søgning på tværs af lektioner (lesson + fix), rå feedback (text/PROD-ID/feature) og false positives. */
export function SearchView({
  q,
  lessons,
  raw,
  falsePositives,
}: {
  q: string;
  lessons: WithId<PlanioLesson>[];
  raw: WithId<PlanioRaw>[];
  falsePositives: WithId<PlanioFalsePositive>[];
}) {
  const ql = q.toLowerCase();
  const lh = lessons.filter((l) => `${l.lesson} ${l.fix}`.toLowerCase().includes(ql));
  const rh = raw.filter((r) =>
    `${r.text} ${r.prodId ?? ''} ${r.feature ?? ''} ${r.src ?? ''}`.toLowerCase().includes(ql),
  );
  const fh = falsePositives.filter((fp) => fp.text.toLowerCase().includes(ql));

  return (
    <View className="gap-4">
      <AppText variant="muted" className="text-[11px]">
        {lh.length + rh.length + fh.length} resultater for “{q}”
      </AppText>

      {lh.length ? (
        <View className="gap-2">
          <AppText variant="label">Lektioner</AppText>
          {lh.map((l) => {
            const cfg = spotConfig(l.spot);
            return (
              <Card key={l.id} className="gap-1">
                {cfg ? (
                  <View style={{ backgroundColor: cfg.bg }} className="self-start rounded px-2 py-0.5">
                    <AppText style={{ color: cfg.accent }} className="text-[11px]">
                      {cfg.name}
                    </AppText>
                  </View>
                ) : null}
                <AppText>{l.lesson}</AppText>
                <AppText variant="muted" className="text-xs">→ {l.fix}</AppText>
              </Card>
            );
          })}
        </View>
      ) : null}

      {rh.length ? (
        <View className="gap-2">
          <AppText variant="label">Rå feedback</AppText>
          {rh.map((r) => {
            const meta = [r.prodId, r.feature].filter(Boolean).join(' · ') || r.src;
            return (
              <Card key={r.id}>
                {meta ? <AppText variant="muted" className="mb-0.5 text-[10px]">{meta}</AppText> : null}
                <AppText className="text-sm">{r.text}</AppText>
              </Card>
            );
          })}
        </View>
      ) : null}

      {fh.length ? (
        <View className="gap-2">
          <AppText variant="label">False positives</AppText>
          {fh.map((fp) => (
            <Card key={fp.id}>
              <AppText className="text-sm">{fp.text}</AppText>
            </Card>
          ))}
        </View>
      ) : null}

      {lh.length + rh.length + fh.length === 0 ? (
        <AppText variant="muted" className="py-6 text-center">Ingen match.</AppText>
      ) : null}
    </View>
  );
}
