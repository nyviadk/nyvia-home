import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { Pressable } from '@/tw';
import { usePlanioFalsePositivesStore } from '../../data/planio-stores';
import { deleteFalsePositive } from '../../data/planio.repository';
import type { PlanioFalsePositive, PlanioRaw } from '../../types';

/** Rå feedback-post i arkivet — klik åbner detaljen. */
export function RawItem({ raw, onOpen }: { raw: WithId<PlanioRaw>; onOpen: () => void }) {
  const meta = [raw.prodId, raw.feature].filter(Boolean).join(' · ') || raw.src;
  return (
    <Pressable accessibilityRole="button" onPress={onOpen}>
      <Card className="gap-0.5">
        {meta ? (
          <AppText variant="muted" className="text-[10px]">
            {meta}
          </AppText>
        ) : null}
        <AppText className="text-sm" numberOfLines={2}>
          {raw.text}
        </AppText>
      </Card>
    </Pressable>
  );
}

/** En kendt false positive — kun tekst og slet. */
export function FalsePositiveItem({ fp }: { fp: WithId<PlanioFalsePositive> }) {
  const onDelete = () =>
    void confirmDelete({
      title: 'Slet false positive',
      name: fp.text,
      message: 'Fjern denne false positive?',
      toast: 'False positive slettet',
      markPending: () => usePlanioFalsePositivesStore.pending.mark(fp.id),
      unmarkPending: () => usePlanioFalsePositivesStore.pending.unmark(fp.id),
      remove: () => deleteFalsePositive(fp.id),
    });
  return (
    <Card className="flex-row items-start gap-3 py-3">
      <AppText className="flex-1 text-sm">{fp.text}</AppText>
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
        <AppText className="text-xs text-danger">slet</AppText>
      </Pressable>
    </Card>
  );
}
