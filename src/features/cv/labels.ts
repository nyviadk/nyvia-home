import type { CvCollKey } from './data/cv-repos';

/** Danske navne på kollektionerne. Ét sted, så hub, katalog og import siger det samme. */
export const COLL_LABEL: Record<CvCollKey, string> = {
  jobs: 'Jobs',
  punkter: 'Punkter',
  projekter: 'Projekter',
  grupper: 'Kompetencegrupper',
  kompetencer: 'Kompetencer',
  uddannelse: 'Uddannelse',
  referencer: 'Referencer',
  sprogfaerdigheder: 'Sprog',
};

/** Entals-form til tomme tilstande og knaptekster. */
export const COLL_SINGULAR: Record<CvCollKey, string> = {
  jobs: 'job',
  punkter: 'punkt',
  projekter: 'projekt',
  grupper: 'gruppe',
  kompetencer: 'kompetence',
  uddannelse: 'uddannelse',
  referencer: 'reference',
  sprogfaerdigheder: 'sprog',
};
