import { nowISO } from '@/lib/datetime';
import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import { db, storage, type WithId } from '@/lib/firebase';
import { requireUid } from '@/lib/firebase/require-uid';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
import type { SpanishEntry, SpanishEntryInput, SpanishImage } from '../types';

const repo = createUserCollectionRepo<SpanishEntry, SpanishEntryInput>({
  collection: 'spanishEntries',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: 'Tilføjet',
});

export const subscribeSpanishEntries = repo.subscribe;

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteSpanishEntry = repo.remove;

/** Et billede der endnu ikke er uploadet (fra billedvælgeren) vs. et der ligger i Storage. */
export type EditableImage = SpanishImage | { uri: string };

const isUploaded = (img: EditableImage): img is SpanishImage => 'path' in img;

/** Upload de nye billeder; de allerede uploadede beholdes som de er. */
async function uploadNew(
  entryId: string,
  images: EditableImage[],
  onProgress?: (done: number, total: number) => void
): Promise<SpanishImage[]> {
  const uid = requireUid();
  const total = images.filter((i) => !isUploaded(i)).length;
  let done = 0;
  const out: SpanishImage[] = [];
  for (const img of images) {
    if (isUploaded(img)) {
      out.push(img);
      continue;
    }
    const path = `users/${uid}/spanish/${entryId}/${genId()}.jpg`;
    out.push({ path, url: await storage.upload(path, img.uri) });
    onProgress?.(++done, total);
  }
  return out;
}

export async function createSpanishEntry(
  input: SpanishEntryInput,
  images: EditableImage[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const id = genId();
  const uploaded = await uploadNew(id, images, onProgress);
  const now = nowISO();
  await toastAfter(
    db.setDoc<SpanishEntry>(
      repo.docPath(id),
      { ...input, ...(uploaded.length ? { images: uploaded } : {}), createdAt: now, updatedAt: now },
      false
    ),
    'Tilføjet'
  );
}

/**
 * Gemmer redigeringen. `images` er den ØNSKEDE endelige liste: nye uploades, og billeder
 * der ikke længere er med slettes i Storage — ellers ville de ligge som forældreløse filer
 * og koste plads for evigt.
 */
export async function updateSpanishEntry(
  entry: WithId<SpanishEntry>,
  input: SpanishEntryInput,
  images: EditableImage[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const uploaded = await uploadNew(entry.id, images, onProgress);
  const kept = new Set(uploaded.map((i) => i.path));
  await Promise.all(
    (entry.images ?? [])
      .filter((i) => !kept.has(i.path))
      .map((i) => storage.remove(i.path).catch(() => undefined))
  );
  await toastAfter(
    db.setDoc<SpanishEntry>(
      repo.docPath(entry.id),
      {
        ...input,
        ...(uploaded.length ? { images: uploaded } : {}),
        createdAt: entry.createdAt,
        updatedAt: nowISO(),
      },
      false
    ),
    'Gemt'
  );
}

/** Rydder også billederne i Storage. Kaldes af fortryd-flowet, når vinduet er udløbet. */
export async function deleteSpanishEntryWithImages(entry: WithId<SpanishEntry>): Promise<void> {
  await Promise.all(
    (entry.images ?? []).map((i) => storage.remove(i.path).catch(() => undefined))
  );
  await deleteSpanishEntry(entry.id);
}
