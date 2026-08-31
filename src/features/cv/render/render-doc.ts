import { T } from '../i18n';
import type { CvSnapshot } from '../data/catalogue-io';
import type { CvSelection } from '../selection/selection';
import { normalizeLink, type CvLang, type CvLink, type CvOm, type CvPerson, type CvText } from '../types';

/**
 * Alt hvad de to sider skal bruge — fladt, sproget allerede opløst, ingen `CvText` tilbage.
 *
 * HTML-byggerne må ikke slå noget op i kataloget og ikke vælge sprog. Gør de det, ender
 * sprogreglen med at stå tre steder, og de tre steder bliver uenige.
 */
/** `id` følger med, så rettelses-editoren kan pege på præcis dette punkt. */
export interface RenderPunkt {
  id: string;
  tekst: string;
}

export interface RenderJob {
  rende: string;
  rolle: string;
  hvor: string;
  note: string;
  punkter: RenderPunkt[];
  reference: RenderRef | null;
}

export interface RenderRef {
  navn: string;
  titel: string;
  kontakt: string;
  periode: string;
}

export interface RenderProjekt {
  id: string;
  /** Året. Står i renden — den må aldrig være tom (regel 8). */
  rende: string;
  navn: string;
  /** "åben kilde · nyvia.dk" — året er flyttet i renden. */
  meta: string;
  tekst: string;
}

export interface RenderDoc {
  lang: CvLang;
  brandfarve: string;
  navn: string;
  titel: string;
  /**
   * Linje 1 i hovedet, stykke for stykke: mail, telefon, by.
   *
   * Som liste og ikke som én sammensat streng, fordi FØRSTE stykke — mailen — skal stå i
   * `.staerk` og resten dæmpet. Var det én streng, ville hele linjen enten være fremhævet
   * eller ingen af den, og så gør `.kontakt .staerk` i CSS'en ingenting.
   */
  kontakt: string[];
  /** Linje 2: klikbare links. Tekst og adresse er ikke det samme. */
  links: CvLink[];
  foto: string;
  profiltekst: string;
  kompetencer: { gruppe: string; navne: string[] }[];
  jobs: RenderJob[];
  projekter: RenderProjekt[];
  omAfsnit: string[];
  anerkendelse: string;
  uddannelse: { rende: string; grad: string; hvor: string; note: string }[];
  /** Rolle og firma hver for sig — rollen sættes i fed på side 2. */
  oevrig: { rende: string; rolle: string; firma: string }[];
  referencer: RenderRef[];
  sprog: { niveau: string; navn: string }[];
}

/**
 * Håndrettelser til ÉN ansøgning.
 *
 * Gemmes sammen med selectionen og rører aldrig katalogets tekst. Uden den adskillelse
 * ville en tilpasning til ét opslag sive ud i alle fremtidige CV'er — og så er kataloget
 * ikke længere sandheden.
 */
export type CvOverrides = {
  titel?: string;
  profiltekst?: string;
  /** punkt-id → erstatningstekst. */
  punkter?: Record<string, string>;
  /** projekt-id → erstatningstekst. */
  projekter?: Record<string, string>;
};

const t = (v: unknown, lang: CvLang) => T(v as CvText | undefined, lang);
const s = (v: unknown) => (typeof v === 'string' ? v : '');

/** `til: null` betyder stadig i gang. Renden er ALDRIG tom — så hører indholdet ikke til her. */
const periode = (doc: Record<string, unknown>) => {
  const fra = s(doc.fra);
  const til = doc.til === null || doc.til === undefined || doc.til === '' ? 'nu' : s(doc.til);
  return fra ? `${fra}–${til}` : til;
};

/**
 * Selection + katalog + sprog → det der skal tegnes.
 *
 * ⚠️ Rækkefølgen kommer fra SELECTIONENS arrays, ikke fra katalogets `orden`. Katalogets
 * `orden` er browse-rækkefølge; selectionen er print-rækkefølge. Sorterer man her, får man
 * en anden rækkefølge end den Claude valgte til netop dette opslag.
 */
export function resolveSelection(
  sel: CvSelection,
  snapshot: CvSnapshot,
  settings: { person: CvPerson; om: CvOm },
  brandfarve: string,
  /** Håndrettelser til netop denne ansøgning. Katalogets tekst røres ikke. */
  overrides: CvOverrides = {}
): RenderDoc {
  const lang = sel.sprog;
  const { person, om } = settings;
  /** Tom streng er en gyldig rettelse ("fjern linjen") — derfor `?? `, ikke `||`. */
  const ret = (id: string, hvor: 'punkter' | 'projekter', fald: string) =>
    overrides[hvor]?.[id] ?? fald;

  const ref = (id: string): RenderRef | null => {
    const r = snapshot.referencer[id];
    if (!r) return null;
    return {
      navn: s(r.navn),
      titel: t(r.titel, lang),
      kontakt: s(r.kontakt),
      periode: s(r.periode),
    };
  };

  const jobs = sel.erfaring.map((block) => {
    const job = snapshot.jobs[block.id] ?? {};
    const punkter = block.punkter.map(([punktId, variant]) => {
      const p = snapshot.punkter[punktId] ?? {};
      const varianter = (p.varianter ?? {}) as Record<string, CvText>;
      // Findes varianten ikke, tages den første. Valideringen har allerede sagt fra, så
      // dette er kun en nødudgang — ikke en tilladelse til at vælge forkert.
      const value = varianter[variant] ?? Object.values(varianter)[0];
      return { id: punktId, tekst: ret(punktId, 'punkter', t(value, lang)) };
    });

    return {
      rende: periode(job),
      rolle: t(job.rolle, lang),
      hvor: [s(job.firma), s(job.sted)].filter(Boolean).join(' · '),
      note: t(job.note, lang),
      punkter,
      reference:
        sel.reference_efter === block.id && sel.reference_side1 ? ref(sel.reference_side1) : null,
    };
  });

  /**
   * ⚠️ En kompetence hvis gruppe ikke findes, kommer ikke med — der er ingen overskrift at
   * sætte den under, og at opfinde en ville sætte en gruppe i et printet CV som brugeren
   * aldrig har skrevet. `validateSelection` afviser derfor selectionen FØR vi når hertil,
   * og det er dét tjek der er sikkerheden. Fjernes det, forsvinder kompetencen i tavshed.
   */
  const kompetencer = Object.entries(snapshot.grupper)
    .map(([gid, g]) => ({
      orden: typeof g.orden === 'number' ? g.orden : 999,
      gruppe: t(g.navn, lang),
      navne: sel.kompetencer
        .filter((id) => snapshot.kompetencer[id]?.gruppe === gid)
        .map((id) => t(snapshot.kompetencer[id].navn, lang)),
    }))
    .filter((g) => g.navne.length > 0)
    .sort((a, b) => a.orden - b.orden)
    .map(({ gruppe, navne }) => ({ gruppe, navne }));

  return {
    lang,
    brandfarve,
    navn: person.navn,
    titel: overrides.titel ?? sel.titel,
    kontakt: [person.email, person.telefon, person.by].filter(Boolean),
    links: (person.links ?? [])
      .map(normalizeLink)
      .filter((l): l is CvLink => l !== null),
    foto: person.foto ?? '',
    profiltekst: overrides.profiltekst ?? sel.profiltekst,
    kompetencer,
    jobs,
    projekter: sel.projekter.map(([id, variant]) => {
      const p = snapshot.projekter[id] ?? {};
      const varianter = (p.varianter ?? {}) as Record<string, CvText>;
      return {
        id,
        // Året i renden — den må aldrig være tom, og et projekt uden årstal er stadig et
        // projekt, så "—" er bedre end et hul der får rækken til at se i stykker ud.
        rende: s(p.aar) || '—',
        navn: s(p.navn),
        meta: [p.aabenkilde ? 'åben kilde' : '', s(p.link)].filter(Boolean).join(' · '),
        tekst: ret(id, 'projekter', t(varianter[variant] ?? Object.values(varianter)[0], lang)),
      };
    }),
    omAfsnit: t(om.personlig, lang).split(/\n{2,}/).filter(Boolean),
    anerkendelse: t(om.anerkendelse, lang),
    uddannelse: sel.uddannelse.map((id) => {
      const u = snapshot.uddannelse[id] ?? {};
      return {
        rende: periode(u),
        grad: t(u.grad, lang),
        hvor: t(u.sted, lang),
        note: t(u.note, lang),
      };
    }),
    oevrig: sel.oevrig.map((id) => {
      const j = snapshot.jobs[id] ?? {};
      return { rende: periode(j), rolle: t(j.rolle, lang), firma: s(j.firma) };
    }),
    referencer: sel.referencer.map(ref).filter((r): r is RenderRef => r !== null),
    sprog: sel.sprogfaerdigheder.map((id) => {
      const sp = snapshot.sprogfaerdigheder[id] ?? {};
      // Niveau i renden, sprognavn i indholdet: renden må aldrig være tom, og et sprog har
      // ingen dato. Derfor blev det niveauet der flyttede derover.
      return { niveau: t(sp.niveau, lang), navn: t(sp.navn, lang) };
    }),
  };
}

/**
 * Hvor meget der er valgt. Bruges i beskeden når CV'et ikke passer på to sider.
 *
 * Tælles på det OPLØSTE dokument og ikke på selectionen: kompetencerne ligger fladt i
 * selectionen, men grupperet her, og det er summen på tværs af grupper der betyder noget
 * for hvor meget plads de fylder.
 */
export const taelValgte = (doc: RenderDoc) => ({
  punkter: doc.jobs.reduce((n, j) => n + j.punkter.length, 0),
  kompetencer: doc.kompetencer.reduce((n, g) => n + g.navne.length, 0),
  projekter: doc.projekter.length,
});
