import type { FitMaal } from './fit';

/**
 * Native-stubben. PDF'en er bevidst web-only — det er ikke noget man gør fra telefonen.
 *
 * Findes som platform-split og ikke som en `EXPO_OS`-gren, fordi kun splittet holder
 * DOM-koden HELT ude af native-bundtet. En gren ville stadig få Metro til at pakke
 * `document` og `HTMLIFrameElement` med.
 *
 * Skærmen når aldrig hertil (ruten viser `WebOnlyScreen` på native), men filen skal findes
 * for at importen kan resolves.
 */
export interface CvFrame {
  write(html: string): Promise<void>;
  measure(): FitMaal;
  print(): void;
  visOverloeb(paa: boolean): void;
  tom(): void;
  destroy(): void;
}

// Samme signatur som web-udgaven. tsc typetjekker mod DENNE fil, så afviger den, opdages
// fejlen først når web-bundtet kører. `_host` med understreg, ellers klager
// `--noUnusedParameters`.
export function createCvFrame(_host: HTMLElement): CvFrame {
  return {
    write: () => Promise.reject(new Error('CV-print findes kun på web')),
    measure: () => ({ side1: 0, side2: 0, plads: 1, pxPerMm: 1 }),
    print: () => undefined,
    visOverloeb: () => undefined,
    tom: () => undefined,
    destroy: () => undefined,
  };
}
