import { T } from '../i18n';
import type { CvSnapshot } from '../data/catalogue-io';
import { sortDocs } from '../catalogue/registry';
import type { CvLang, CvText } from '../types';

/**
 * Menuteksten der lægges på udklipsholderen og pastes ind i Claude sammen med jobopslaget.
 *
 * Det er `sandhed`-feltet der vises — ikke varianterne. Menuen skal kunne være i en
 * samtale sammen med et helt jobopslag, og de tre-fire varianter pr. punkt ville tredoble
 * den uden at hjælpe valget: Claude vælger hvilket punkt og hvilken VINKEL, ikke hvilken
 * formulering.
 */

const rows = <T extends { id: string }>(coll: Record<string, Record<string, unknown>>) =>
  sortDocs(Object.entries(coll).map(([id, doc]) => ({ id, ...doc }))) as unknown as (T &
    Record<string, unknown>)[];

const t = (v: unknown, lang: CvLang) => T(v as CvText | undefined, lang);

const pad = (s: string, n: number) => (s.length >= n ? `${s} ` : s.padEnd(n));

/**
 * Variantlisten i firkantparentes.
 *
 * Et punkt uden varianter har ingen tekst at vise på siden, og enhver selection der peger
 * på det, bliver forkastet. Tomme `[]` så bare ud som en variant der hed ingenting — så
 * valgte Claude punktet, og valideringen afviste hele CV'et med "varianten findes ikke"
 * uanset hvad der stod. Nu står der hvad der er galt, dér hvor det læses.
 */
const variantList = (doc: Record<string, unknown>) => {
  const keys = Object.keys((doc.varianter ?? {}) as object);
  return keys.length ? `[${keys.join('|')}]` : '[⚠ ingen varianter — kan ikke vælges]';
};

/** `til: null` betyder stadig i gang. */
const periode = (doc: Record<string, unknown>) =>
  `${doc.fra ?? ''}–${doc.til === null || doc.til === undefined || doc.til === '' ? 'nu' : doc.til}`;

export function buildMenu(snapshot: CvSnapshot, lang: CvLang = 'da'): string {
  const out: string[] = [];
  const punkter = rows(snapshot.punkter);

  out.push('SIDE 1 — ERFARING');
  for (const job of rows(snapshot.jobs)) {
    out.push(
      `  ${job.id}  ${t(job.rolle, lang)} · ${job.firma ?? ''} · ${periode(job)}`
    );
    for (const p of punkter.filter((x) => x.job === job.id)) {
      out.push(`    ${pad(p.id, 18)} ${variantList(p)}  ${p.sandhed ?? ''}`);
    }
  }

  const hjemloese = punkter.filter((p) => !snapshot.jobs[p.job as string]);
  if (hjemloese.length) {
    // Et punkt uden et gyldigt job kan ikke placeres på siden. Det skal STÅ der, ikke
    // udelades i tavshed — ellers leder man efter et punkt der aldrig kom med.
    out.push('', '  ⚠ punkter uden gyldigt job (kan ikke bruges):');
    for (const p of hjemloese) out.push(`    ${p.id} → job "${p.job}" findes ikke`);
  }

  out.push('', 'SIDE 1 — PROJEKTER');
  for (const p of rows(snapshot.projekter)) {
    out.push(
      `    ${pad(p.id, 18)} ${variantList(p)}  ${p.navn ?? ''} (${p.aar ?? ''}) — ${p.sandhed ?? ''}`
    );
  }

  out.push('', 'SIDE 1 — KOMPETENCER');
  for (const g of rows(snapshot.grupper)) {
    const ids = rows(snapshot.kompetencer)
      .filter((k) => k.gruppe === g.id)
      .map((k) => k.id);
    if (ids.length) out.push(`    ${t(g.navn, lang)}: ${ids.join(' ')}`);
  }
  const ugrupperede = rows(snapshot.kompetencer).filter((k) => !snapshot.grupper[k.gruppe as string]);
  if (ugrupperede.length) {
    out.push(`    ⚠ uden gyldig gruppe: ${ugrupperede.map((k) => k.id).join(' ')}`);
  }

  out.push('', 'SIDE 2 — UDDANNELSE');
  out.push(`    ${rows(snapshot.uddannelse).map((u) => u.id).join(' ')}`);
  out.push('SIDE 2 — REFERENCER');
  out.push(`    ${rows(snapshot.referencer).map((r) => r.id).join(' ')}`);
  out.push('SIDE 2 — ØVRIG ERHVERVSERFARING (kompakt, én linje pr. job)');
  out.push(`    ${rows(snapshot.jobs).map((j) => j.id).join(' ')}`);
  out.push('SIDE 2 — SPROG');
  out.push(`    ${rows(snapshot.sprogfaerdigheder).map((s) => s.id).join(' ')}`);

  out.push('', MENU_RULES);
  return out.join('\n');
}

/**
 * Reglerne Claude skal følge.
 *
 * `sprog` er kun "da" eller "en". Prototypen kunne skrive to filer på én gang; browserens
 * print-dialog kan én ad gangen, så "begge" afvises i valideringen — og så må menuen heller
 * ikke bede om det. Ellers svarer Claude med noget der bliver forkastet.
 */
export const MENU_RULES = `REGLER
  Svar kun med et selection-JSON. Brug udelukkende ID'er herfra.
  'punkter' er [id, variant]-par i den rækkefølge de skal stå på siden.
  'sprog' er "da" eller "en". 'brandfarve' er virksomhedens hex-kode.
  Kun 'profiltekst' og 'titel' er fritekst — profilteksten max fire linjer.
  Teksten under OM MIG på side 2 kommer fra kataloget og vælges ikke.
  Kompetencer: vælg fra HØJST 3 grupper, og højst 6 fra hver — de vigtigste for
  netop dette opslag. Alt skal være på to sider, og kompetencerne står på side 1.

FORMAT
{
  "job": { "firma": "…", "titel": "…", "dato": "ÅÅÅÅ-MM-DD" },
  "sprog": "da",
  "brandfarve": "#0b5c3b",
  "titel": "…",
  "profiltekst": "…",
  "kompetencer": ["react", "node"],
  "erfaring": [{ "id": "myplanio", "punkter": [["mp_kryptering", "teknisk"]] }],
  "reference_side1": "michael",
  "reference_efter": "myplanio",
  "projekter": [["nyviaevi", "teknisk"]],
  "uddannelse": ["pba", "mmd"],
  "oevrig": ["netto"],
  "referencer": ["ebbe"],
  "sprogfaerdigheder": ["dansk"]
}`;
