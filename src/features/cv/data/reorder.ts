import { nowISO } from '@/lib/datetime';
import { db, type BatchOp } from '@/lib/firebase';
import { notify } from '@/lib/toast/notify';
import { CV_REPOS, type CvCollKey } from './cv-repos';

/**
 * Flyt én post op eller ned.
 *
 * Hele kollektionen renummereres 1..n i ÉN batch frem for at bytte to tal. To grunde:
 * en halvt gennemført ombytning efterlader to poster med samme `orden` og en liste der
 * omarrangerer sig selv ved næste snapshot — og renummereringen reparerer samtidig de
 * poster der slet ikke havde et `orden` (fx importerede projekter).
 *
 * Kun de poster hvis tal faktisk ændrer sig, skrives.
 */
export function moveInOrder(
  coll: CvCollKey,
  orderedIds: readonly string[],
  current: Record<string, { orden?: number }>,
  from: number,
  to: number
): Promise<void> {
  if (to < 0 || to >= orderedIds.length || from === to) return Promise.resolve();

  const next = [...orderedIds];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  const now = nowISO();
  const ops: BatchOp[] = [];
  next.forEach((id, i) => {
    const orden = i + 1;
    /**
     * Kun poster der stadig FINDES. `update` på et slettet dokument afviser hele batchen,
     * så én post slettet på en anden enhed ville få alle pilene til at holde op med at
     * virke — uden en eneste besked, fordi der ikke er nogen at vise den til.
     */
    const doc = current[id];
    if (!doc || doc.orden === orden) return;
    ops.push({
      type: 'update',
      path: CV_REPOS[coll].docPath(id),
      data: { orden, updatedAt: now },
    });
  });

  if (!ops.length) return Promise.resolve();

  /**
   * Kun fejl-toast. En kvittering på hvert tryk på en pil ville være støj — men fejler
   * skrivningen, ser det ud som om pilen bare ikke virker, og det skal man have at vide.
   */
  return db.commitBatch(ops).catch(() => notify('Kunne ikke gemme rækkefølgen'));
}

/** Næste ledige plads — nye poster lægges sidst, aldrig midt i. */
export const nextOrden = (docs: readonly { orden?: number }[]): number =>
  docs.reduce((max, d) => Math.max(max, typeof d.orden === 'number' ? d.orden : 0), 0) + 1;
