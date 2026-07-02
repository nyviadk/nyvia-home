import { nowISO } from '@/lib/datetime';
import { auth, type BatchOp, type CollectionSnapshot, db, storage, type Unsubscribe, type WithId } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { toastAfter } from '@/lib/toast/notify';
import type { InspectionItem, InspectionItemInput, InspectionPhoto } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const collPath = () => `users/${requireUid()}/inspectionItems`;
const docPath = (id: string) => `${collPath()}/${id}`;

export function subscribeInspectionItems(
  onChange: (snap: CollectionSnapshot<InspectionItem>) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeCollection<InspectionItem>(
    collPath(),
    { orderByField: 'createdAt', orderDirection: 'desc' },
    onChange,
    onError
  );
}

/**
 * Uploader de valgte billeder til Storage og opretter syns-posten. `onProgress`
 * kaldes pr. uploadet billede så UI kan vise fremdrift.
 */
export async function createInspectionItem(
  input: InspectionItemInput,
  uris: string[],
  onProgress?: (done: number, total: number) => void
): Promise<string> {
  const uid = requireUid();
  const itemId = genId();
  const photos: InspectionPhoto[] = [];
  for (const uri of uris) {
    const path = `users/${uid}/homes/${input.homeId}/inspection/${itemId}/${genId()}.jpg`;
    const url = await storage.upload(path, uri);
    photos.push({ path, url });
    onProgress?.(photos.length, uris.length);
  }

  const now = nowISO();
  const doc: InspectionItem = {
    homeId: input.homeId,
    title: input.title,
    photos,
    createdAt: now,
    updatedAt: now,
    ...(input.room ? { room: input.room } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
  await db.setDoc<InspectionItem>(docPath(itemId), doc, false);
  return itemId;
}

/** Nøgle til at samle poster: rum + titel (case-insensitivt). */
const groupKey = (room: string | undefined, title: string) =>
  `${(room ?? '').trim().toLowerCase()}|${title.trim().toLowerCase()}`;

/**
 * Bulk: hver GRUPPE (billeder med samme rum + note) bliver én syns-post med flere fotos.
 * Findes der ALLEREDE en post med samme rum+titel (fx fra en tidligere omgang), tilføjes
 * de nye fotos til den i stedet for at oprette en dublet — så samme mangel altid er samlet.
 * Billeder uploades sekventielt (progress) og dokumenterne skrives i én batch.
 */
export async function createInspectionGroups(
  homeId: string,
  groups: { room?: string; title: string; photos: { uri: string; takenAt?: string }[] }[],
  existing: WithId<InspectionItem>[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const uid = requireUid();
  const now = nowISO();
  const total = groups.reduce((n, g) => n + g.photos.length, 0);
  const ops: BatchOp[] = [];
  let done = 0;

  const byKey = new Map<string, WithId<InspectionItem>>();
  for (const it of existing) {
    if (it.homeId === homeId) byKey.set(groupKey(it.room, it.title), it);
  }

  for (const group of groups) {
    const key = groupKey(group.room, group.title);
    const match = byKey.get(key);
    const itemId = match ? match.id : genId();

    const uploaded: InspectionPhoto[] = [];
    for (const p of group.photos) {
      const path = `users/${uid}/homes/${homeId}/inspection/${itemId}/${genId()}.jpg`;
      const url = await storage.upload(path, p.uri);
      uploaded.push({ path, url, ...(p.takenAt ? { takenAt: p.takenAt } : {}) });
      onProgress?.(++done, total);
    }

    if (match) {
      const photos = [...match.photos, ...uploaded];
      ops.push({ type: 'update', path: docPath(itemId), data: { photos, updatedAt: now } });
      byKey.set(key, { ...match, photos });
    } else {
      const doc: InspectionItem = {
        homeId,
        title: group.title,
        photos: uploaded,
        createdAt: now,
        updatedAt: now,
        ...(group.room ? { room: group.room } : {}),
      };
      ops.push({ type: 'set', path: docPath(itemId), data: doc });
      byKey.set(key, { id: itemId, ...doc });
    }
  }
  await db.commitBatch(ops);
}

/**
 * Redigér en post: opdater rum/titel/note + fotos. `photos` er den ØNSKEDE endelige liste —
 * eksisterende fotos ({path,url}) beholdes, nye ({uri}) uploades, og fotos der ikke længere
 * er med slettes i Storage.
 */
export async function saveInspectionEdit(
  item: WithId<InspectionItem>,
  fields: { room?: string; title: string; notes?: string },
  photos: (InspectionPhoto | { uri: string; takenAt?: string })[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const uid = requireUid();
  const newCount = photos.filter((p) => 'uri' in p).length;
  let done = 0;
  const finalPhotos: InspectionPhoto[] = [];
  for (const p of photos) {
    if ('path' in p) {
      finalPhotos.push(p);
    } else {
      const path = `users/${uid}/homes/${item.homeId}/inspection/${item.id}/${genId()}.jpg`;
      const url = await storage.upload(path, p.uri);
      finalPhotos.push({ path, url, ...(p.takenAt ? { takenAt: p.takenAt } : {}) });
      onProgress?.(++done, newCount);
    }
  }
  const kept = new Set(finalPhotos.map((p) => p.path));
  await Promise.all(
    item.photos
      .filter((p) => !kept.has(p.path))
      .map((p) => storage.remove(p.path).catch(() => undefined))
  );
  const doc: InspectionItem = {
    homeId: item.homeId,
    title: fields.title,
    photos: finalPhotos,
    createdAt: item.createdAt,
    updatedAt: nowISO(),
    ...(fields.room ? { room: fields.room } : {}),
    ...(fields.notes ? { notes: fields.notes } : {}),
  };
  await toastAfter(db.setDoc<InspectionItem>(docPath(item.id), doc, false), 'Syns-post opdateret');
}

/** Sletter posten + dens billeder i Storage. */
export async function deleteInspectionItem(item: WithId<InspectionItem>): Promise<void> {
  await toastAfter(
    (async () => {
      await Promise.all(item.photos.map((p) => storage.remove(p.path).catch(() => undefined)));
      await db.deleteDoc(docPath(item.id));
    })(),
    'Syns-post slettet'
  );
}
