/**
 * Auto-tilpasningen: find den største skala hvor begge sider passer.
 *
 * Ingen DOM her. `measure` injiceres, så trappen kan køres i Node med opdigtede tal — og
 * så kan man teste at gulvet FAKTISK holder uden at have en browser.
 *
 * ⚠️ Krymper aldrig under 96 %. Det var oprindeligt en glidende skala ned til 86 %, og
 * resultatet var et komprimeret CV uden luft. Gulvet er hele pointen: passer det ikke,
 * skal der skæres i selectionen — ikke gøres skriften mindre.
 */

export interface FitMaal {
  /** Indholdets faktiske højde på side 1, i px. */
  side1: number;
  side2: number;
  /** Hvor høj indholdsboksen er, i px. Samme for begge sider. */
  plads: number;
  /** Browserens egen målestok. Hardkodede 794/1123 bager en afrundingsfejl ind. */
  pxPerMm: number;
}

export interface FitResultat {
  k: number;
  passer: boolean;
  maal: FitMaal;
  /** Hvor mange mm for meget der er på den værste side. 0 når det passer. */
  forMeget: number;
  /** Hvilken side der er den værste — den man skal skære i. */
  vaerste: 1 | 2;
}

/**
 * Prøv skalaerne i rækkefølge og stop ved den første der passer.
 *
 * Returnerer ALTID et resultat. Passer ingen af dem, kommer det sidste forsøg tilbage med
 * `passer: false` og hvor meget der er for meget — den oplysning er det eneste brugbare
 * svar, for "det passer ikke" uden et tal er ikke til at handle på.
 */
export async function findFit(
  steps: readonly number[],
  measure: (k: number) => Promise<FitMaal>
): Promise<FitResultat> {
  if (!steps.length) throw new Error('findFit: ingen skalatrin');

  let sidste: FitMaal | null = null;
  let sidsteK = steps[0];

  for (const k of steps) {
    const maal = await measure(k);
    sidste = maal;
    sidsteK = k;
    if (maal.side1 <= maal.plads && maal.side2 <= maal.plads) {
      return { k, passer: true, maal, forMeget: 0, vaerste: 1 };
    }
  }

  const maal = sidste as FitMaal;
  const over1 = maal.side1 - maal.plads;
  const over2 = maal.side2 - maal.plads;
  const vaerste: 1 | 2 = over1 >= over2 ? 1 : 2;
  return {
    k: sidsteK,
    passer: false,
    maal,
    forMeget: Math.max(over1, over2) / (maal.pxPerMm || 1),
    vaerste,
  };
}

/**
 * Beskeden når det ikke passer.
 *
 * Siger hvor meget der er for meget og hvad der er valgt — man skal kunne handle på den
 * uden at gætte. Formuleringen følger specifikationen: skær i selectionen, gør ikke
 * skriften mindre.
 */
export function fitBesked(
  r: FitResultat,
  antal: { punkter: number; kompetencer: number; projekter: number }
): string {
  const mm = Math.ceil(r.forMeget);
  return [
    `Passer ikke på 2 sider — side ${r.vaerste} er ${mm} mm for lang, selv ved 96 %.`,
    `Der er valgt ${antal.punkter} punkter, ${antal.kompetencer} kompetencer og ${antal.projekter} projekter.`,
    'Skær i selectionen frem for at gøre skriften mindre.',
  ].join('\n');
}
