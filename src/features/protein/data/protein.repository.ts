import { nowISO } from '@/lib/datetime';
import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import { db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { omitUndefined } from '@/lib/firebase/omit-undefined';
import { requireUid } from '@/lib/firebase/require-uid';
import { toastAfter } from '@/lib/toast/notify';
import type {
  ProteinFood,
  ProteinFoodInput,
  ProteinLogEntry,
  ProteinLogInput,
  ProteinSettings,
} from '../types';

/** Kataloget: skabeloner man kan logge igen og igen. */
const foods = createUserCollectionRepo<ProteinFood, ProteinFoodInput>({
  collection: 'proteinFoods',
  orderBy: { field: 'name', direction: 'asc' },
  createdToast: 'Ret gemt',
});

export const subscribeFoods = foods.subscribe;
export const createFood = foods.create;
export const updateFood = foods.update;
/** Sletning toaster ikke — fortryd-toasten er kvitteringen. */
export const deleteFood = foods.remove;

/**
 * Skjul eller genfremkald en ret. Ikke en sletning: retten og dens tal bliver stående, og
 * de poster i logbogen der peger på den, er upåvirkede uanset hvad.
 */
export function setFoodHidden(id: string, hidden: boolean): Promise<void> {
  return foods.patch(id, { hidden }, hidden ? 'Skjult' : 'Vist igen');
}

/**
 * Logbogen. Sorteret på `day` faldende, så nyeste dag ligger først og uge-visningen kan
 * læse fra toppen uden at sortere hele historikken igen.
 */
const log = createUserCollectionRepo<ProteinLogEntry, ProteinLogInput>({
  collection: 'proteinLog',
  orderBy: { field: 'day', direction: 'desc' },
  // Tavs: man logger mad mange gange om dagen, og en toast pr. gang ville stå i vejen for
  // den næste knap. Tallet i toppen springer med det samme — dét er kvitteringen.
  createdToast: null,
});

export const subscribeLog = log.subscribe;
export const updateLogEntry = log.update;
export const deleteLogEntry = log.remove;

/** `omitUndefined`: `foodId`, `tags` og `estimated` er valgfri, og Firestore afviser undefined. */
export function addLogEntry(input: ProteinLogInput): Promise<string> {
  return log.create(omitUndefined(input));
}

/** Skift kun antallet af portioner. Bruges af +/− i dagens liste. */
export function setLogQty(id: string, qty: number): Promise<void> {
  return log.patch(id, { qty }, null);
}

/**
 * Ryd en hel dag i én batch frem for N enkelt-sletninger — alt-eller-intet, og ét kald.
 * Kaldes af fortryd-flowet når vinduet er udløbet.
 */
export function deleteEntries(ids: readonly string[]): Promise<void> {
  return db.commitBatch(ids.map((id) => ({ type: 'delete' as const, path: log.docPath(id) })));
}

// Ét fast indstillings-dokument pr. bruger — samme mønster som forbrug og budget.
const settingsPath = () => `users/${requireUid()}/settings/protein`;

export function subscribeProteinSettings(
  onChange: (doc: WithId<ProteinSettings> | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeDoc<ProteinSettings>(settingsPath(), onChange, onError);
}

export function saveProteinSettings(
  values: Omit<ProteinSettings, 'updatedAt'>
): Promise<void> {
  return toastAfter(
    db.setDoc(settingsPath(), { ...values, updatedAt: nowISO() }, true),
    'Mål gemt'
  );
}
