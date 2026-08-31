/**
 * Gør tekst inert i HTML.
 *
 * Skal bruges på HVER eneste indsættelse i en HTML-streng. Teksten kommer fra brugerens
 * eget katalog og fra en sprogmodels svar — begge dele kan indeholde `<`, og ét overset
 * felt er én dårlig indsættelse fra et ødelagt dokument.
 *
 * Lå privat i `inspection.export.ts`; udtrukket ved anden brug (CV-renderingen).
 *
 * `'` er med. Den originale undveg kun `&<>"`, og det holder præcis så længe hver eneste
 * attribut i hver eneste bygger bruger dobbelte anførselstegn. Ét `href='…'` et sted, og
 * et navn med en apostrof — Nyvia O'Brien — bryder ud af attributten.
 */
export const escapeHtml = (s: string): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
