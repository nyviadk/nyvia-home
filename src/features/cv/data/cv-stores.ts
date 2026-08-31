import { createCollectionStore } from '@/lib/db/collection-store';
import { createDocStore } from '@/lib/db/doc-store';
import type { WithId } from '@/lib/firebase';
import {
  DEFAULT_STIL,
  EMPTY_OM,
  EMPTY_PERSON,
  type CvAnsoegning,
  type CvGruppe,
  type CvImport,
  type CvIndstillinger,
  type CvJob,
  type CvKompetence,
  type CvOm,
  type CvPerson,
  type CvProjekt,
  type CvPunkt,
  type CvReference,
  type CvSprog,
  type CvStandard,
  type CvStil,
  type CvUddannelse,
} from '../types';
import {
  ansoegningerRepo,
  importsRepo,
  grupperRepo,
  jobsRepo,
  kompetencerRepo,
  projekterRepo,
  punkterRepo,
  referencerRepo,
  sprogRepo,
  subscribeCvSettings,
  subscribeCvStandard,
  uddannelseRepo,
} from './cv-repos';

export const useCvJobs = createCollectionStore<CvJob>('nyvia.cv-jobs', jobsRepo.subscribe);
export const useCvPunkter = createCollectionStore<CvPunkt>('nyvia.cv-punkter', punkterRepo.subscribe);
export const useCvProjekter = createCollectionStore<CvProjekt>('nyvia.cv-projekter', projekterRepo.subscribe);
export const useCvGrupper = createCollectionStore<CvGruppe>('nyvia.cv-grupper', grupperRepo.subscribe);
export const useCvKompetencer = createCollectionStore<CvKompetence>('nyvia.cv-kompetencer', kompetencerRepo.subscribe);
export const useCvUddannelse = createCollectionStore<CvUddannelse>('nyvia.cv-uddannelse', uddannelseRepo.subscribe);
export const useCvReferencer = createCollectionStore<CvReference>('nyvia.cv-referencer', referencerRepo.subscribe);
export const useCvSprog = createCollectionStore<CvSprog>('nyvia.cv-sprog', sprogRepo.subscribe);
export const useCvAnsoegninger = createCollectionStore<CvAnsoegning>('nyvia.cv-ansoegninger', ansoegningerRepo.subscribe);
export const useCvImports = createCollectionStore<CvImport>('nyvia.cv-imports', importsRepo.subscribe);

/**
 * Katalogets stores i én tabel, så import/eksport og menuen kan løbe dem igennem uden at
 * kende hver enkelt. Nøglerne matcher `CV_REPOS`.
 */
export const CV_STORES = {
  jobs: useCvJobs,
  punkter: useCvPunkter,
  projekter: useCvProjekter,
  grupper: useCvGrupper,
  kompetencer: useCvKompetencer,
  uddannelse: useCvUddannelse,
  referencer: useCvReferencer,
  sprogfaerdigheder: useCvSprog,
} as const;

/**
 * Indstillingerne. `empty` er de faktiske standardværdier og ikke nuller — har man aldrig
 * åbnet skærmen, skal en rendering stadig kunne regne rigtigt.
 */
export const useCvSettings = createDocStore<
  WithId<CvIndstillinger>,
  { stil: CvStil; person: CvPerson; om: CvOm }
>({
  key: 'nyvia.cv-settings',
  persistName: 'cv-settings',
  subscribe: subscribeCvSettings,
  empty: { stil: DEFAULT_STIL, person: EMPTY_PERSON, om: EMPTY_OM },
  map: (doc) => ({
    stil: { ...DEFAULT_STIL, ...doc.stil },
    person: { ...EMPTY_PERSON, ...doc.person },
    om: { ...EMPTY_OM, ...doc.om },
  }),
});

/**
 * Standard-CV'et. `empty.selection` er tom streng — og dét betyder "brug appens eget
 * udgangspunkt", ikke "et tomt CV". Skelnen sker på indholdet, ikke på `exists`, fordi et
 * gemt men tomt dokument er lige så meget "ingen standard" som slet intet dokument.
 */
export const useCvStandard = createDocStore<WithId<CvStandard>, { selection: string }>({
  key: 'nyvia.cv-standard',
  persistName: 'cv-standard',
  subscribe: subscribeCvStandard,
  empty: { selection: '' },
  map: (doc) => ({ selection: doc.selection ?? '' }),
});
