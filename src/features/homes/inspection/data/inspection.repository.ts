import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, storage, type Unsubscribe, type WithId } from '@/lib/firebase';
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
