import type { ProteinLogEntry, ProteinSettings } from './types';

/**
 * Dagens regnskab og systemets ene stykke egentlige logik: at holde øje med at protein og
 * kalorier følges ad.
 *
 * Problemet der løses: de to mål trækker i hver sin retning. Rammer man 120 g protein på
 * 1400 kcal, mangler man 1400 kcal og har ikke plads-argumentet til at spise noget magert.
 * Rammer man 2800 kcal på 70 g protein, er dagen brugt op og resten af proteinet koster
 * kalorier man ikke har. Begge dele opdager man for sent, hvis man kun ser to tal.
 */
export interface Totals {
  proteinG: number;
  kcal: number;
}

export const EMPTY_TOTALS: Totals = { proteinG: 0, kcal: 0 };

export function sumTotals(entries: readonly ProteinLogEntry[]): Totals {
  return entries.reduce<Totals>(
    (acc, e) => ({
      proteinG: acc.proteinG + e.proteinG * e.qty,
      kcal: acc.kcal + e.kcal * e.qty,
    }),
    EMPTY_TOTALS
  );
}

export type BalanceState =
  | 'tomt'
  | 'paa-vej'
  | 'mangler-protein'
  | 'mangler-energi'
  | 'i-maal'
  | 'over-kcal';

export interface Assessment {
  state: BalanceState;
  /** Én sætning der siger hvad status er, i gram og kalorier. */
  headline: string;
  /**
   * Én sætning der siger hvad man skal gøre. Tom når der ikke er noget at gøre.
   *
   * Bevidst uden regnestykker. Et råd som "sigt efter 11 g protein pr. 100 kcal" er korrekt
   * og fuldstændig ubrugeligt, når man står ved køleskabet — man skal kunne handle på det
   * uden at regne. Der står derfor hvad man skal fokusere på, ikke hvad forholdet er.
   */
  advice: string;
  remainingProteinG: number;
  remainingKcal: number;
  proteinPct: number;
  kcalPct: number;
}

/** Hvor skævt de to mål må ligge, før det er værd at sige noget. 15 point af dagsmålet. */
const SKEW = 0.15;
/** Kalorier tæller som ramt inden for ±5 % — man vejer ikke sin mad på et gram. */
const KCAL_BAND = 0.05;

const round = (n: number) => Math.round(n);

export function assess(totals: Totals, settings: ProteinSettings): Assessment {
  const goalP = Math.max(1, settings.proteinGoalG);
  const goalK = Math.max(1, settings.kcalGoalKcal);

  const remainingProteinG = round(goalP - totals.proteinG);
  const remainingKcal = round(goalK - totals.kcal);
  const proteinPct = totals.proteinG / goalP;
  const kcalPct = totals.kcal / goalK;

  const proteinDone = remainingProteinG <= 0;
  const kcalDone = kcalPct >= 1 - KCAL_BAND;
  const kcalOver = kcalPct > 1 + KCAL_BAND;

  const base = { remainingProteinG, remainingKcal, proteinPct, kcalPct };

  if (totals.proteinG === 0 && totals.kcal === 0) {
    return {
      ...base,
      state: 'tomt',
      headline: 'Ingenting logget endnu',
      advice: `Dagen er ${goalP} g protein og ${goalK} kcal.`,
    };
  }

  if (kcalOver) {
    return {
      ...base,
      state: 'over-kcal',
      headline: proteinDone
        ? `Protein i mål · ${-remainingKcal} kcal over`
        : `${-remainingKcal} kcal over, og der mangler ${remainingProteinG} g protein`,
      advice: proteinDone
        ? ''
        : 'Kalorierne er brugt op. Tag det med mindst kalorier i, eller lad det ligge — det er ugegennemsnittet der tæller.',
    };
  }

  if (proteinDone && kcalDone) {
    return { ...base, state: 'i-maal', headline: 'Begge mål ramt', advice: '' };
  }

  // Protein nået, men der er stadig energi tilbage at spise.
  if (proteinDone) {
    return {
      ...base,
      state: 'mangler-energi',
      headline: `Protein i mål · ${remainingKcal} kcal tilbage`,
      advice: 'Fokusér på kalorier resten af dagen. Du behøver ikke mere protein.',
    };
  }

  // Kalorierne er brugt op (eller så godt som), men proteinet mangler.
  if (kcalDone) {
    return {
      ...base,
      state: 'mangler-protein',
      headline: `${remainingProteinG} g protein tilbage · kalorierne er brugt`,
      advice:
        'Alt hvad du spiser nu, går over kaloriemålet. Vælg det med mest protein og færrest kalorier.',
    };
  }

  const skew = proteinPct - kcalPct;

  if (skew > SKEW) {
    return {
      ...base,
      state: 'mangler-energi',
      headline: `${remainingKcal} kcal tilbage, kun ${remainingProteinG} g protein`,
      advice: 'Fokusér på kalorier resten af dagen. Proteinet er godt med.',
    };
  }

  if (skew < -SKEW) {
    return {
      ...base,
      state: 'mangler-protein',
      headline: `${remainingProteinG} g protein tilbage på ${remainingKcal} kcal`,
      advice: 'Fokusér på protein resten af dagen. Kalorierne løber fra dig.',
    };
  }

  return {
    ...base,
    state: 'paa-vej',
    headline: `${remainingProteinG} g protein og ${remainingKcal} kcal tilbage`,
    advice: 'De to følges pænt ad. Spis som du plejer.',
  };
}
