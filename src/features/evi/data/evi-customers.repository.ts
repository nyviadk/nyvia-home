import { createUserCollectionRepo } from '@/lib/db/user-collection-repo';
import type { EviAnswers, EviAnswerValue, EviCustomer } from '../types';

const repo = createUserCollectionRepo<EviCustomer, { companyName: string; answers: EviAnswers }>({
  collection: 'eviCustomers',
  orderBy: { field: 'updatedAt', direction: 'desc' },
  createdToast: 'Kunde oprettet',
});

export const subscribeEviCustomers = repo.subscribe;

export const createEviCustomer = (companyName: string) =>
  repo.create({ companyName: companyName.trim(), answers: {} });

export const renameEviCustomer = (id: string, companyName: string) =>
  repo.patch(id, { companyName: companyName.trim() }, null);

/**
 * Sæt ét svar. Dot-path (`answers.<feltId>`) rører KUN dette felt — de øvrige svar
 * bevares. Silent (løbende gem); UI viser selv en gem-status. Feltet ryddes ved at
 * sætte en tom værdi ('' / [] / false), ikke ved at slette nøglen.
 */
export const setEviAnswer = (id: string, fieldId: string, value: EviAnswerValue) =>
  repo.patch(id, { [`answers.${fieldId}`]: value }, null);

/** Sletning toaster ikke her — håndteres af confirmDelete (fortryd). */
export const deleteEviCustomer = repo.remove;
