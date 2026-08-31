import { nowISO } from '@/lib/datetime';
import { db, type BatchOp } from '@/lib/firebase';
import { omitUndefined } from '@/lib/firebase/omit-undefined';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
import type { CvSnapshot, ImportPlan } from './catalogue-io';
import { CV_REPOS, importsRepo, mergeCvSettings, type CvCollKey } from './cv-repos';

/**
 * Skriv en importplan til Firestore.
 *
 * Importen TILFØJER kun. Den sletter aldrig, og den overskriver aldrig: findes id'et
 * allerede, bliver posten stående som den er. Retter man noget, gør man det i appen —
 * ikke ved at køre en fil igennem igen.
 *
 * Grunden er at det ellers er umuligt at vide hvad man mister. En import der både opretter
 * og overskriver, kan skrive en dags arbejde væk uden at nævne det.
 */
export async function importCatalogue(
  plan: ImportPlan,
  opts?: { onProgress?: (done: number, total: number) => void }
): Promise<number> {
  const now = nowISO();
  /**
   * Id'et mintes FØR skrivningen og sættes på hver post, så importen kan fortrydes samlet
   * bagefter. Uden det kan man kun rydde op post for post.
   */
  const importId = genId();

  const ops: BatchOp[] = [];
  const fordeling: Record<string, number> = {};

  for (const { key, rows } of plan.collections) {
    for (const row of rows) {
      if (row.status !== 'ny') continue;
      ops.push({
        type: 'set',
        path: CV_REPOS[key].docPath(row.id),
        data: omitUndefined({ ...row.data, importId, createdAt: now, updatedAt: now }),
        merge: false,
      });
      fordeling[key] = (fordeling[key] ?? 0) + 1;
    }
  }

  if (ops.length === 0 && !plan.settings) return 0;

  await toastAfter(
    (async () => {
      if (ops.length) {
        await db.commitBatch(ops, opts);
        /**
         * Historik-dokumentet skrives med `setDoc` og SAMME id som posterne bærer.
         *
         * `repo.create()` bruger `addDoc` og giver et auto-id — og så peger `importId` på
         * posterne aldrig på historikken. Resultatet var en "slet import"-knap der fandt
         * nul poster og kun fjernede historik-linjen, mens hele importen blev stående.
         *
         * Skrives EFTER posterne: fejler batchen, står der ikke en import i historikken
         * som intet oprettede.
         */
        await db.setDoc(
          importsRepo.docPath(importId),
          { antal: ops.length, fordeling, createdAt: now, updatedAt: now },
          false
        );
      }
      // Fletter (ikke erstatter): en fil kan indeholde `stil` uden `person`, og så må de
      // andre sektioner ikke ryge med. At den overhovedet MÅ skrive her, er allerede
      // afgjort i `parseImport` — `plan.settings` er kun sat når der ingen er i forvejen.
      if (plan.settings) await mergeCvSettings(plan.settings);
    })(),
    `${ops.length} poster tilføjet`
  );
  return ops.length;
}

/**
 * Fortryd en hel import: slet præcis de poster den oprettede.
 *
 * Der ledes efter `importId` i det kataloget indeholder LIGE NU. Har man rettet en post i
 * appen siden, er dens `importId` fjernet, og den overlever — man mister ikke sit eget
 * arbejde ved at rydde op efter en fejl-import.
 */
export function findImportedIds(
  snapshot: CvSnapshot,
  importId: string
): { key: CvCollKey; id: string }[] {
  const out: { key: CvCollKey; id: string }[] = [];
  for (const [key, coll] of Object.entries(snapshot) as [CvCollKey, Record<string, Record<string, unknown>>][]) {
    for (const [id, doc] of Object.entries(coll)) {
      if (doc.importId === importId) out.push({ key, id });
    }
  }
  return out;
}

export function deleteImported(
  targets: readonly { key: CvCollKey; id: string }[],
  importDocId: string
): Promise<void> {
  return db.commitBatch([
    ...targets.map((t) => ({ type: 'delete' as const, path: CV_REPOS[t.key].docPath(t.id) })),
    { type: 'delete' as const, path: importsRepo.docPath(importDocId) },
  ]);
}
