import type { CvLang, CvText } from './types';

/**
 * Sprogreglen — ÉT sted, brugt af både læseren og skriveren.
 *
 * Ligger de to hver sit sted, kommer de før eller siden til at være uenige om hvad "samme
 * på begge sprog" betyder, og så dukker der engelsk tekst op i et dansk CV uden at nogen
 * har rørt noget.
 */

/**
 * Læs et tekstfelt i ét sprog.
 *
 * Dansk er fallback og ikke tom streng: mangler en engelsk oversættelse, er den danske
 * tekst det mindst forkerte man kan vise. Et hul i CV'et er værre end et forkert sprog.
 */
export function T(value: CvText | undefined, lang: CvLang): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  return (lang === 'en' ? value.en : value.da) || value.da || '';
}

/**
 * Skriv et tekstfelt fra formularens to felter.
 *
 * Er engelsk tomt eller ordret det samme som dansk, gemmes ÉN streng. Det er ikke for at
 * spare plads: en ren streng betyder "det hedder det samme", mens et par med to ens
 * strenge betyder "nogen har skrevet det af to gange" — og den forskel forsvinder hvis
 * man altid gemmer et par.
 */
export function toStoredText(da: string, en: string): CvText {
  const d = da.trim();
  const e = en.trim();
  return !e || e === d ? d : { da: d, en: e };
}

/** Modsat vej: ét felt → formularens to felter. */
export function fromStoredText(value: CvText | undefined): { da: string; en: string } {
  if (value === undefined) return { da: '', en: '' };
  if (typeof value === 'string') return { da: value, en: '' };
  return { da: value.da ?? '', en: value.en ?? '' };
}
