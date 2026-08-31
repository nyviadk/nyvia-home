/**
 * Én ting der er galt, med nok kontekst til at kunne rettes.
 *
 * Fælles for import og for selection-validering, fordi de har samme kontrakt: intet må
 * springes over i tavshed, og fejlene skal komme ALLE på én gang. Får man dem én ad
 * gangen, retter man én ting, kører igen, og finder den næste — fem gange i træk.
 */
export interface CvIssue {
  /** Hvor i inputtet, fx `punkter.mp_eas` eller `erfaring[0].punkter[1]`. */
  hvor: string;
  hvad: string;
  /**
   * Det der ville have virket. Ved en ukendt variant: dem der findes — dén oplysning er
   * det meste af værdien i beskeden.
   */
  muligheder?: string[];
}

export const issue = (hvor: string, hvad: string, muligheder?: string[]): CvIssue => ({
  hvor,
  hvad,
  ...(muligheder?.length ? { muligheder } : {}),
});
