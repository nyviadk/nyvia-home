import { createJSONStorage, type PersistOptions } from 'zustand/middleware';

import { zustandStorage } from './kv';

/**
 * Delte zustand-persist-options: gemmer kun de valgte `keys` (MMKV på native, localStorage på
 * web) og slår et evt. `loading`-flag fra ved rehydrering, så cachede data males med det samme
 * uden spinner. Firestore-listeneren opdaterer bagefter (last-write-wins).
 */
export function persistOptions<T extends object>(
  name: string,
  keys: (keyof T)[],
): PersistOptions<T, Partial<T>> {
  return {
    name: `nyvia:${name}`,
    storage: createJSONStorage(() => zustandStorage),
    partialize: (state) =>
      Object.fromEntries(keys.map((k) => [k, state[k]])) as Partial<T>,
    merge: (persistedState, current) => {
      const merged = { ...current, ...(persistedState as Partial<T> | undefined) };
      // Har vi en cachet tilstand, er vi ikke "loading" længere — vis den straks.
      if (persistedState && 'loading' in merged) {
        (merged as { loading?: boolean }).loading = false;
      }
      return merged as T;
    },
  };
}
