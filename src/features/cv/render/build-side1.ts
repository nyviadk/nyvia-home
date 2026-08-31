import { escapeHtml as e } from '@/lib/html/escape-html';
import type { RenderDoc, RenderRef } from './render-doc';

/**
 * Side 1: hoved, bånd, profil, kompetencer, erfaring, projekter.
 *
 * Byggeren slår INTET op i kataloget og vælger ikke sprog — `RenderDoc` er allerede fladt
 * og oversat. Gjorde den det, ville sprogreglen stå tre steder, og de tre steder ville
 * blive uenige.
 *
 * Hver eneste indsættelse går gennem `e()`. Teksten kommer fra brugerens katalog og fra
 * en sprogmodels svar; ét overset felt er én dårlig indsættelse fra et ødelagt dokument.
 */

/** Sektion der udelades helt når den er tom — en overskrift uden indhold er en fejl på papir. */
const sektion = (titel: string, indhold: string): string =>
  indhold ? `<section class="sektion"><h2>${e(titel)}</h2>${indhold}</section>` : '';

/**
 * Referencen inde i et job.
 *
 * Ligger i `.krop` sammen med punkterne og ikke efter posten: den skal klæbe til sit eget
 * job. `.har-ref` giver posten det større spring ned til det næste job, så referencen ikke
 * flyder midt imellem to jobs.
 */
const joberef = (r: RenderRef): string => `
  <div class="joberef">
    <div class="mrk">Reference</div>
    <div class="navn2">${e(r.navn)}</div>
    <div class="linje">${e([r.titel, r.periode].filter(Boolean).join(' · '))}</div>
    ${r.kontakt ? `<div class="linje">${e(r.kontakt)}</div>` : ''}
  </div>`;

export function buildSide1(doc: RenderDoc): string {
  const en = doc.lang === 'en';

  // Linje 1 er kontaktoplysningerne, linje 2 er links. To linjer, som specifikationen siger.
  // Kun FØRSTE stykke (mailen) er fremhævet — det er dét man skal kunne finde på et sekund.
  const kontaktLinjer = [
    doc.kontakt.length
      ? `<div><span class="staerk">${e(doc.kontakt[0])}</span>${doc.kontakt
          .slice(1)
          .map((k) => ` · ${e(k)}`)
          .join('')}</div>`
      : '',
    doc.links.length
      ? `<div>${doc.links
          .map((l) => `<a href="${e(l.url)}">${e(l.tekst)}</a>`)
          .join(' · ')}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const hoved = `
  <div class="hoved">
    <div class="titelblok">
      <div class="navn">${e(doc.navn)}</div>
      ${doc.titel ? `<div class="rolle">${e(doc.titel)}</div>` : ''}
      ${kontaktLinjer ? `<div class="kontakt">${kontaktLinjer}</div>` : ''}
    </div>
    ${doc.foto ? `<img class="foto" src="${e(doc.foto)}" alt="">` : ''}
  </div>
  <div class="baand"></div>`;

  const profil = doc.profiltekst ? `<div class="profil">${e(doc.profiltekst)}</div>` : '';

  const kompetencer = sektion(
    en ? 'SKILLS' : 'KOMPETENCER',
    doc.kompetencer
      .map(
        (g) => `
    <div class="raekke">
      <div class="etiket">${e(g.gruppe)}</div>
      <div class="liste">${g.navne.map((n) => `<span class="brik">${e(n)}</span>`).join('')}</div>
    </div>`
      )
      .join('')
  );

  const erfaring = sektion(
    en ? 'EXPERIENCE' : 'ERFARING',
    doc.jobs
      .map(
        (j) => `
    <div class="post${j.reference ? ' har-ref' : ''}">
      <div class="dato">${e(j.rende)}</div>
      <div class="krop">
        <h3>${e(j.rolle)}</h3>
        ${j.hvor ? `<div class="hvor">${e(j.hvor)}</div>` : ''}
        ${j.note ? `<div class="jobnote">${e(j.note)}</div>` : ''}
        ${
          j.punkter.length
            ? `<ul>${j.punkter.map((p) => `<li>${e(p.tekst)}</li>`).join('')}</ul>`
            : ''
        }
        ${j.reference ? joberef(j.reference) : ''}
      </div>
    </div>`
      )
      .join('')
  );

  const projekter = sektion(
    en ? 'SELECTED PROJECTS' : 'UDVALGTE PROJEKTER',
    doc.projekter
      .map(
        (p) => `
    <div class="post">
      <div class="dato">${e(p.rende)}</div>
      <div class="krop">
        <div class="projekt-hoved">
          <h3>${e(p.navn)}</h3>
          ${p.meta ? `<div class="projekt-meta">${e(p.meta)}</div>` : ''}
        </div>
        ${p.tekst ? `<div class="projekt-tekst">${e(p.tekst)}</div>` : ''}
      </div>
    </div>`
      )
      .join('')
  );

  return `<section class="side side1"><div class="inner">${hoved}${profil}${kompetencer}${erfaring}${projekter}</div></section>`;
}
