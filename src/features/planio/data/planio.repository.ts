import { auth, type BatchOp, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { nowISO } from '@/lib/datetime';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
import type {
  PlanioFalsePositive,
  PlanioLesson,
  PlanioLessonInput,
  PlanioRaw,
  PlanioRawInput,
} from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const lessonsPath = () => `users/${requireUid()}/planioLessons`;
const lessonPath = (id: string) => `${lessonsPath()}/${id}`;
const rawPath = () => `users/${requireUid()}/planioRawFeedback`;
const rawDocPath = (id: string) => `${rawPath()}/${id}`;
const fpPath = () => `users/${requireUid()}/planioFalsePositives`;
const fpDocPath = (id: string) => `${fpPath()}/${id}`;

/* ---- Lektioner (knowledgebase) ---- */

export function subscribeLessons(
  onChange: (snap: CollectionSnapshot<PlanioLesson>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<PlanioLesson>(
    lessonsPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError,
  );
}

export function addLesson(input: PlanioLessonInput): Promise<string> {
  const src = input.src?.trim();
  return toastAfter(
    db.addDoc<PlanioLesson>(lessonsPath(), {
      spot: input.spot,
      weight: input.weight,
      lesson: input.lesson.trim(),
      fix: input.fix.trim(),
      ...(src ? { src } : {}),
      createdAt: nowISO(),
    }),
    'Lektion filet i knowledgebase',
  );
}

export function deleteLesson(id: string): Promise<void> {
  return toastAfter(db.deleteDoc(lessonPath(id)), 'Lektion slettet');
}

/* ---- Rå feedback (arkiv) ---- */

export function subscribeRaw(
  onChange: (snap: CollectionSnapshot<PlanioRaw>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<PlanioRaw>(
    rawPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError,
  );
}

export function addRaw(input: PlanioRawInput): Promise<string> {
  const src = input.src?.trim();
  const prodId = input.prodId?.trim();
  const feature = input.feature?.trim();
  return toastAfter(
    db.addDoc<PlanioRaw>(rawPath(), {
      text: input.text.trim(),
      ...(prodId ? { prodId } : {}),
      ...(feature ? { feature } : {}),
      ...(src ? { src } : {}),
      createdAt: nowISO(),
    }),
    'Rå feedback gemt i arkiv',
  );
}

export function deleteRaw(id: string): Promise<void> {
  return toastAfter(db.deleteDoc(rawDocPath(id)), 'Slettet');
}

/* ---- False positives (global — ét sæt) ---- */

export function subscribeFalsePositives(
  onChange: (snap: CollectionSnapshot<PlanioFalsePositive>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<PlanioFalsePositive>(
    fpPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError,
  );
}

/**
 * Tilføj (mange) false positives fra en indsat liste. `existing` = allerede gemte tekster, så vi
 * ikke laver dubletter. Skriver i én batch (aldrig Promise.all af individuelle writes). Returnerer
 * antal reelt tilføjet.
 */
export async function addFalsePositives(texts: string[], existing: string[]): Promise<number> {
  const seen = new Set(existing.map((t) => t.toLowerCase()));
  const fresh: string[] = [];
  for (const t of texts) {
    const key = t.toLowerCase();
    if (t && !seen.has(key)) {
      seen.add(key);
      fresh.push(t);
    }
  }
  if (fresh.length === 0) return 0;
  const now = nowISO();
  const ops: BatchOp[] = fresh.map((text) => ({
    type: 'set',
    path: `${fpPath()}/${genId()}`,
    data: { text, createdAt: now },
  }));
  await toastAfter(db.commitBatch(ops), `${fresh.length} false positive(s) gemt`);
  return fresh.length;
}

export function deleteFalsePositive(id: string): Promise<void> {
  return toastAfter(db.deleteDoc(fpDocPath(id)), 'Slettet');
}
