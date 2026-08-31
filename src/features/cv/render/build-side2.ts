import { escapeHtml as e } from '@/lib/html/escape-html';
import type { RenderDoc } from './render-doc';

/**
 * Side 2: toplinje, om mig, uddannelse, øvrig erfaring, referencer, sprog.
 *
 * ⚠️ Renden er ALDRIG tom (regel 8 i specifikationen). Derfor har uddannelse en periode,
 * øvrig erfaring en periode, referencer en periode og sprog et NIVEAU i renden — det var
 * netop derfor sprog endte som "niveau i renden, sprognavn i indholdet" og ikke omvendt.
 */

const sektion = (titel: string, indhold: string): string =>
  indhold ? `<section class="sektion"><h2>${e(titel)}</h2>${indhold}</section>` : '';

/** Etiket i renden, indhold ved siden af. Den ene byggesten side 2 er lavet af. */
const raekke = (etiket: string, indhold: string, klasse = ''): string => `
  <div class="raekke${klasse ? ` ${klasse}` : ''}">
    <div class="etiket">${e(etiket)}</div>
    <div class="liste">${indhold}</div>
  </div>`;

export function buildSide2(doc: RenderDoc): string {
  const en = doc.lang === 'en';

  const toplinje = `
  <div class="toplinje">
    <span class="n">${e(doc.navn)}</span>
    <span>${en ? 'page 2 of 2' : 'side 2 af 2'}</span>
  </div>
  <div class="baand"></div>`;

  /**
   * Om mig: prosa i afsnit, slutlinjen i kursiv. Anerkendelsen står bevidst som sit eget
   * afsnit og ikke klistret på det sidste — den er en anden slags udsagn.
   */
  const om = sektion(
    en ? 'ABOUT ME' : 'OM MIG',
    doc.omAfsnit.length || doc.anerkendelse
      ? `<div class="omtekst">${doc.omAfsnit.map((p) => `<p>${e(p)}</p>`).join('')}${
          doc.anerkendelse ? `<p class="udenfor">${e(doc.anerkendelse)}</p>` : ''
        }</div>`
      : ''
  );

  const uddannelse = sektion(
    en ? 'EDUCATION' : 'UDDANNELSE',
    doc.uddannelse
      .map(
        (u) => `
    <div class="post">
      <div class="dato">${e(u.rende)}</div>
      <div class="krop">
        <h3>${e(u.grad)}</h3>
        ${u.hvor ? `<div class="hvor">${e(u.hvor)}</div>` : ''}
        ${u.note ? `<div class="jobnote">${e(u.note)}</div>` : ''}
      </div>
    </div>`
      )
      .join('')
  );

  const oevrig = sektion(
    en ? 'OTHER EXPERIENCE' : 'ØVRIG ERHVERVSERFARING',
    doc.oevrig
      .map((j) =>
        raekke(
          j.rende,
          `<b>${e(j.rolle)}</b>${j.firma ? ` · ${e(j.firma)}` : ''}`
        )
      )
      .join('')
  );

  /**
   * Referencer: periode i renden, navn og titel i indholdet, kontakten på egen linje.
   * `.ref` oven på `.raekke` giver det større mellemrum — CSS'ens senere regel vinder.
   */
  const referencer = sektion(
    en ? 'REFERENCES' : 'REFERENCER',
    doc.referencer
      .map((r) =>
        raekke(
          r.periode || '—',
          `<b>${e(r.navn)}</b>
           ${r.titel ? `<div class="titel2">${e(r.titel)}</div>` : ''}
           ${r.kontakt ? `<div class="mail">${e(r.kontakt)}</div>` : ''}`,
          'ref'
        )
      )
      .join('')
  );

  const sprog = sektion(
    en ? 'LANGUAGES' : 'SPROG',
    doc.sprog.map((s) => raekke(s.niveau || '—', `<b>${e(s.navn)}</b>`)).join('')
  );

  return `<section class="side side2"><div class="inner">${toplinje}${om}${uddannelse}${oevrig}${referencer}${sprog}</div></section>`;
}
