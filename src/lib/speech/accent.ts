/**
 * Delt mellem web- og native-grenen af talelaget, så typerne og — vigtigst —
 * STEMMEVALGET kun findes ét sted. Valgte de to grene hver sin stemme, ville skærmen
 * kunne vise noget andet end det man hører.
 */

/**
 * `es-ES` = Spanien (c/z som /θ/), `es-MX` = latinamerikansk (c/z som /s/).
 * Vi bruger es-MX frem for det generiske es-419, fordi det er det tag der reelt findes
 * som stemme på både Android og i browsere.
 */
export type SpeechAccent = 'es-ES' | 'es-MX';

export interface SpeechVoiceInfo {
  /** Platformens identifikator — sendes med ved oplæsning, så valget er utvetydigt. */
  id: string;
  name: string;
  /** BCP-47, fx 'es-ES'. Normaliseret med bindestreg. */
  lang: string;
}

export const normalizeLang = (lang: string) => lang.replace('_', '-');

/**
 * Hvilken stemme bruges reelt for en accent?
 *
 * 1. Præcist sprogtag (es-ES / es-MX).
 * 2. Ellers en hvilken som helst spansk stemme — bedre end browserens standard, der
 *    typisk er engelsk og gør spansk ulæseligt.
 * 3. Ellers ingenting; så lader vi platformen om det.
 *
 * Trin 2 er grunden til at to accenter kan lyde ens: har enheden kun én spansk stemme,
 * ender begge valg dér. Det skal UI'et sige højt i stedet for at lade brugeren gætte.
 */
export function pickVoice(
  voices: readonly SpeechVoiceInfo[],
  accent: SpeechAccent
): SpeechVoiceInfo | undefined {
  return (
    voices.find((v) => normalizeLang(v.lang) === accent) ??
    voices.find((v) => normalizeLang(v.lang).startsWith('es'))
  );
}

/** Landenavn ud fra sprogtag — pænere end at vise "es-CO" i UI'et. */
export function regionLabel(lang: string): string {
  const region = normalizeLang(lang).split('-')[1]?.toUpperCase();
  const names: Record<string, string> = {
    ES: 'Spanien',
    MX: 'Mexico',
    US: 'USA',
    AR: 'Argentina',
    CO: 'Colombia',
    CL: 'Chile',
    PE: 'Peru',
    VE: 'Venezuela',
  };
  return region ? (names[region] ?? region) : 'ukendt';
}
