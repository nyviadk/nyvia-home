import { nowISO } from '@/lib/datetime';
import { auth, type CollectionSnapshot, db, type Unsubscribe } from '@/lib/firebase';
import { toastAfter } from '@/lib/toast/notify';
import type { EviAnswerValue, EviCustomer } from '../types';

function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}

const customersPath = () => `users/${requireUid()}/eviCustomers`;
const customerPath = (id: string) => `${customersPath()}/${id}`;

export function subscribeEviCustomers(
  onChange: (snap: CollectionSnapshot<EviCustomer>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return db.subscribeCollection<EviCustomer>(
    customersPath(),
    { orderByField: 'updatedAt', orderDirection: 'desc' },
    onChange,
    onError,
  );
}

export function createEviCustomer(companyName: string): Promise<string> {
  const now = nowISO();
  return toastAfter(
    db.addDoc<EviCustomer>(customersPath(), {
      companyName: companyName.trim(),
      answers: {},
      createdAt: now,
      updatedAt: now,
    }),
    'Kunde oprettet',
  );
}

export function renameEviCustomer(id: string, companyName: string): Promise<void> {
  return db.updateDoc(customerPath(id), {
    companyName: companyName.trim(),
    updatedAt: nowISO(),
  });
}

/**
 * Sæt ét svar. Dot-path (`answers.<feltId>`) rører KUN dette felt — de øvrige svar
 * bevares. Silent (løbende gem); UI viser selv en gem-status. Feltet ryddes ved at
 * sætte en tom værdi ('' / [] / false), ikke ved at slette nøglen.
 */
export function setEviAnswer(
  id: string,
  fieldId: string,
  value: EviAnswerValue,
): Promise<void> {
  return db.updateDoc(customerPath(id), {
    [`answers.${fieldId}`]: value,
    updatedAt: nowISO(),
  });
}

export function deleteEviCustomer(id: string): Promise<void> {
  return db.deleteDoc(customerPath(id));
}
