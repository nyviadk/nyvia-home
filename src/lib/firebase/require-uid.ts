import { auth } from './client';

/**
 * Den aktive brugers uid, eller en fejl. Alle bruger-scopede Firestore-stier bygges herfra,
 * så en manglende session fejler ét genkendeligt sted i stedet for at ramme en sti med
 * "undefined" i. Lå før kopieret i 19 repositories.
 */
export function requireUid(): string {
  const uid = auth.getCurrentUser()?.uid;
  if (!uid) throw new Error('Ingen aktiv bruger');
  return uid;
}
