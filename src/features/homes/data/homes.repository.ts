import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import type { Home, HomeInput } from '../types';

const repo = createUserCollectionRepo<Home, HomeInput>({
  collection: 'homes',
  orderBy: { field: 'createdAt', direction: 'desc' },
  createdToast: 'Bolig oprettet',
});

export const subscribeHomes = repo.subscribe;
export const createHome = repo.create;
export const updateHome = repo.update;

/** Gemmer fri ekstra-info til indflytningssyn-PDF'en på boligen (rører ikke øvrige felter). */
export const updateHomeReportInfo = (id: string, reportInfo: string) =>
  repo.patch(id, { reportInfo }, null);

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteHome = repo.remove;
