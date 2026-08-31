import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistOptions } from '@/lib/storage/persist-options';
import type { CvOverrides } from '../render/render-doc';

/**
 * Det man er i gang med på "Lav et CV" — gemt lokalt, ikke i Firestore.
 *
 * Uden den mistede man hele selectionen ved at klikke ind på kataloget for at rette en
 * tastefejl og komme tilbage. Det er ikke en fejl man laver én gang: hele pointen med
 * skærmen er at man springer frem og tilbage mellem katalog og udkast.
 *
 * Lokalt og ikke i skyen, fordi det ER et udkast: det bliver til en rigtig ansøgning i det
 * øjeblik valideringen går igennem, og dét dokument ligger i arkivet. To steder ville
 * betyde to sandheder om hvad man var i gang med.
 */
export interface CvDraft {
  /** Rå selection-JSON, som den blev indsat. */
  text: string;
  rettelser: CvOverrides;
  /** Ansøgningen udkastet allerede er gemt som, hvis den er det. */
  ansoegningId: string | null;
  /** Farve valgt i appen. Overstyrer selectionens, fordi den er valgt senere. */
  brandfarve: string | null;
}

const TOMT: CvDraft = { text: '', rettelser: {}, ansoegningId: null, brandfarve: null };

export const useCvDraft = create<
  CvDraft & {
    saet: (patch: Partial<CvDraft>) => void;
    /** Ryd helt — knappen på skærmen. */
    ryd: () => void;
  }
>()(
  persist(
    (set) => ({
      ...TOMT,
      saet: (patch) => set(patch),
      ryd: () => set(TOMT),
    }),
    persistOptions('cv-draft', ['text', 'rettelser', 'ansoegningId', 'brandfarve'])
  )
);
