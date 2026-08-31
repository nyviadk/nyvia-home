import { nowISO } from '@/lib/datetime';
import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import { db, type Unsubscribe, type WithId } from '@/lib/firebase';
import { omitUndefined } from '@/lib/firebase/omit-undefined';
import { requireUid } from '@/lib/firebase/require-uid';
import { toastAfter } from '@/lib/toast/notify';
import type {
  CvAnsoegning,
  CvStandard,
  CvAnsoegningInput,
  CvGruppe,
  CvImport,
  CvIndstillinger,
  CvJob,
  CvKompetence,
  CvProjekt,
  CvPunkt,
  CvReference,
  CvSprog,
  CvUddannelse,
} from '../types';

/**
 * Katalogets ni kollektioner.
 *
 * Ligger under `users/{uid}/` som alt andet i appen — `createUserCollectionRepo` har den rod
 * hårdkodet, og alle features deler den. Navnene har `cv`-præfiks af samme grund som
 * `eviCustomers` og `spanishEntries`: kollektionerne ligger fladt ved siden af hinanden.
 */
/**
 * INGEN `orderBy` — og det er vigtigt.
 *
 * Firestore udelader dokumenter der mangler det felt der sorteres på. Sorterede vi på
 * `orden`, ville en post uden det felt blive skrevet fint og derefter aldrig komme tilbage
 * fra listeneren: usynlig i appen, usynlig i eksporten, men til stede i databasen. Det er
 * præcis den tavse forsvinden hele featuren er bygget for at undgå.
 *
 * Rækkefølgen laves derfor i UI'et, hvor en manglende `orden` bare bliver sidst.
 */
const mk = <Doc extends Record<string, unknown>>(collection: string) =>
  createUserCollectionRepo<Doc, Doc>({
    collection,
    // Tavs: der oprettes via `writeWithSlug` (som toaster selv) eller via import (som toaster samlet).
    createdToast: null,
  });

export const jobsRepo = mk<CvJob>('cvJobs');
export const punkterRepo = mk<CvPunkt>('cvPunkter');
export const projekterRepo = mk<CvProjekt>('cvProjekter');
export const grupperRepo = mk<CvGruppe>('cvGrupper');
export const kompetencerRepo = mk<CvKompetence>('cvKompetencer');
export const uddannelseRepo = mk<CvUddannelse>('cvUddannelse');
export const referencerRepo = mk<CvReference>('cvReferencer');
export const sprogRepo = mk<CvSprog>('cvSprog');

/**
 * Ansøgninger og importer skrives altid med `createdAt`, så her er en `orderBy` sikker —
 * feltet kan ikke mangle, fordi vi selv sætter det.
 */
export const ansoegningerRepo = createUserCollectionRepo<CvAnsoegning, CvAnsoegningInput>({
  collection: 'cvAnsoegninger',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: null,
});

export const importsRepo = createUserCollectionRepo<CvImport, CvImport>({
  collection: 'cvImports',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: null,
});

/** Alle katalog-repositories i én opslagstabel, så import og eksport kan løbe dem igennem. */
export const CV_REPOS = {
  jobs: jobsRepo,
  punkter: punkterRepo,
  projekter: projekterRepo,
  grupper: grupperRepo,
  kompetencer: kompetencerRepo,
  uddannelse: uddannelseRepo,
  referencer: referencerRepo,
  sprogfaerdigheder: sprogRepo,
} as const;

export type CvCollKey = keyof typeof CV_REPOS;

export const CV_COLL_KEYS = Object.keys(CV_REPOS) as CvCollKey[];

export const isCvCollKey = (v: string): v is CvCollKey =>
  (CV_COLL_KEYS as readonly string[]).includes(v);

/**
 * Skriv ét dokument med et VALGT id.
 *
 * `repo.create()` bruger `addDoc` og giver et auto-id — ubrugeligt her, fordi selectionen
 * peger på menneskelige slugs (`myplanio`, `mp_kryptering`). Uden læselige id'er er menuen
 * man paster til Claude heller ikke til at læse.
 */
export function writeWithSlug(
  key: CvCollKey,
  slug: string,
  data: Record<string, unknown>,
  toast: string | null = 'Gemt'
): Promise<void> {
  const now = nowISO();
  const write = db.setDoc(
    CV_REPOS[key].docPath(slug),
    omitUndefined({ ...data, updatedAt: now, createdAt: data.createdAt ?? now }),
    false
  );
  return toast === null ? write : toastAfter(write, toast);
}

// ---- Standard-CV: ét dokument med den selection man starter fra ------------------

const standardPath = () => `users/${requireUid()}/cv/standard`;

export function subscribeCvStandard(
  onChange: (doc: WithId<CvStandard> | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeDoc<CvStandard>(standardPath(), onChange, onError);
}

/** Hele dokumentet, `merge: false` — der er kun ét felt, og det skal kunne erstattes. */
export function saveCvStandard(selection: string): Promise<void> {
  return toastAfter(
    db.setDoc(standardPath(), { selection, updatedAt: nowISO() }, false),
    'Gemt som dit standard-CV'
  );
}

// ---- Indstillinger: ét dokument med stil + person + om ----------------------

const settingsPath = () => `users/${requireUid()}/cv/indstillinger`;

export function subscribeCvSettings(
  onChange: (doc: WithId<CvIndstillinger> | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return db.subscribeDoc<CvIndstillinger>(settingsPath(), onChange, onError);
}

/**
 * Gem HELE indstillingsdokumentet fra formularen. Skriver med `merge: false`.
 *
 * Det er ikke en detalje. `merge: true` fletter også ind i `person`- og `om`-mappet, og et
 * felt man har ryddet, udelades af skriveren — så den gamle værdi blev stående. Trykkede
 * man "Fjern" under fotoet, sagde appen "Gemt", og billedet kom tilbage næste gang skærmen
 * blev åbnet. Med `merge: false` betyder "det står ikke i formularen" at det er væk.
 *
 * Derfor SKAL kaldet indeholde alle tre sektioner. Importen bruger `mergeCvSettings`.
 */
export function saveCvSettings(values: Omit<CvIndstillinger, 'updatedAt'>): Promise<void> {
  return toastAfter(
    db.setDoc(settingsPath(), omitUndefined({ ...values, updatedAt: nowISO() }), false),
    'Gemt'
  );
}

/**
 * Importens vej ind: fletter, og kvitterer ikke selv — importen toaster samlet.
 *
 * Flettes frem for at erstatte, fordi en fil kan indeholde `stil` uden `person`, og så må
 * de andre sektioner ikke ryge med. Om filen overhovedet MÅ skrive her, afgøres i
 * `parseImport` — den skriver kun når der ikke er indstillinger i forvejen.
 */
export function mergeCvSettings(
  values: Partial<Omit<CvIndstillinger, 'updatedAt'>>
): Promise<void> {
  return db.setDoc(settingsPath(), omitUndefined({ ...values, updatedAt: nowISO() }), true);
}
