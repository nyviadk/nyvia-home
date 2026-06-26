/** Kort, lokal id til underposter i et dokument (ikke kryptografisk). */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
