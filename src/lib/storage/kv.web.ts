import type { StateStorage } from 'zustand/middleware';

/**
 * Web-fallback: localStorage (synkron). Fejl (fx quota exceeded ved store datasæt) sluges —
 * web er allerede hurtigt via Firestores IndexedDB-cache, så persistensen er kun en bonus her.
 *
 * Ingen kryptering: en klient-side nøgle ville ligge i samme origin/bundle som en angriber i
 * forvejen har adgang til (XSS/lokal adgang), og Firestores IndexedDB-cache indeholder allerede
 * de samme data i plain-text — så det ville være obfuskering, ikke reel sikkerhed.
 */
export const zustandStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignorér (fx quota exceeded) — så en stor store aldrig crasher web
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignorér
    }
  },
};
