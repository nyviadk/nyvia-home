import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Én MMKV-instans til hele appen (native). MMKV er synkron, så zustand `persist` hydrerer
 * med det SAMME ved kold start — cachede data males før Firestore-listeneren når at svare.
 *
 * Ingen `encryptionKey`: MMKV ligger i appens OS-sandbox (samme beskyttelse som Firestores
 * egen offline-cache, der også er plain-text på disk). At kryptere denne spejl-kopi mens
 * Firestore-cachen står ukrypteret ved siden af giver ingen reel gevinst — og en sikker nøgle
 * fra secure-store ville være asynkron og dermed ødelægge den synkrone kold-start-hydrering.
 */
const mmkv = createMMKV({ id: 'nyvia-store' });

export const zustandStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
};
