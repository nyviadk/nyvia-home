import { issue, type CvIssue } from '../issues';
import type { CvLang } from '../types';

/**
 * Det Claude svarer med, og det man paster ind.
 *
 * Kun `titel` og `profiltekst` er fritekst. Alt andet er ID'er, og det er dét, der gør at
 * fakta ikke kan skride: en formulering kan Claude vælge imellem, men ikke opfinde.
 */
export interface CvSelection {
  job: { firma: string; titel: string; dato: string };
  sprog: CvLang;
  brandfarve?: string;
  titel: string;
  profiltekst: string;
  kompetencer: string[];
  /** Rækkefølgen ER rækkefølgen på siden. Ikke et sæt, en liste. */
  erfaring: { id: string; punkter: [string, string][] }[];
  reference_side1?: string;
  reference_efter?: string;
  projekter: [string, string][];
  uddannelse: string[];
  oevrig: string[];
  referencer: string[];
  sprogfaerdigheder: string[];
}

export interface ParsedSelection {
  selection: CvSelection | null;
  issues: CvIssue[];
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Lister læses med en fejlliste ved siden af.
 *
 * Uden den blev `"kompetencer": "react,node"` — en streng hvor der skulle stå et array —
 * til en tom liste uden et ord, og CV'et blev printet helt uden kompetencer. Det er
 * præcis den slags tavse tab hele valideringen findes for at forhindre.
 */
function strList(v: unknown, where: string, issues: CvIssue[]): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    issues.push(issue(where, 'Skal være en liste af ID’er'));
    return [];
  }
  const out: string[] = [];
  v.forEach((x, i) => {
    if (typeof x === 'string') out.push(x);
    else issues.push(issue(`${where}[${i}]`, 'Skal være et ID som tekst'));
  });
  return out;
}

/** Par af `[id, variant]`. Samme regel: intet springes over uden at det siges. */
function pairList(v: unknown, where: string, issues: CvIssue[]): [string, string][] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    issues.push(issue(where, 'Skal være en liste af [id, variant]-par'));
    return [];
  }
  const out: [string, string][] = [];
  v.forEach((x, i) => {
    if (Array.isArray(x) && typeof x[0] === 'string') {
      out.push([x[0], typeof x[1] === 'string' ? x[1] : '']);
    } else {
      issues.push(issue(`${where}[${i}]`, 'Skal være et par: ["id", "variant"]'));
    }
  });
  return out;
}

/** `#rrggbb` eller `#rgb`. Farven interpoleres direkte ind i print-CSS'en. */
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Læs den indsatte tekst. Kaster aldrig — alt går ud som en `CvIssue`.
 *
 * Formen tjekkes her; om ID'erne findes tjekkes i `validateSelection`. To trin, fordi et
 * ødelagt JSON og et ukendt punkt-id er to helt forskellige fejl at rette.
 */
export function parseSelection(text: string): ParsedSelection {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { selection: null, issues: [issue('hele teksten', `Ikke gyldig JSON: ${(e as Error).message}`)] };
  }
  if (!isObj(raw)) {
    return { selection: null, issues: [issue('hele teksten', 'Skal være et JSON-objekt')] };
  }

  const issues: CvIssue[] = [];
  const job = isObj(raw.job) ? raw.job : {};
  const sprog = raw.sprog;

  if (sprog !== 'da' && sprog !== 'en') {
    issues.push(
      issue(
        'sprog',
        sprog === 'begge'
          ? 'Ét sprog ad gangen — print dansk, skift, print engelsk'
          : `"${String(sprog)}" er ikke et sprog`,
        ['da', 'en']
      )
    );
  }
  if (typeof raw.titel !== 'string' || !raw.titel.trim()) issues.push(issue('titel', 'Mangler'));
  if (typeof raw.profiltekst !== 'string' || !raw.profiltekst.trim()) {
    issues.push(issue('profiltekst', 'Mangler'));
  }
  /**
   * Farven skrives ubehandlet ind i print-CSS'en (`background:${brand}`). Er den ikke en
   * hex-kode, får man enten et usynligt bånd eller en CSS-regel der er noget helt andet
   * end en farve — og `darkenForText` falder tilbage til sort uden at sige noget.
   */
  if (raw.brandfarve !== undefined && (typeof raw.brandfarve !== 'string' || !HEX_RE.test(raw.brandfarve))) {
    issues.push(issue('brandfarve', `"${String(raw.brandfarve)}" er ikke en hex-farve`, ['#1c4b8f']));
  }

  let erfaring: CvSelection['erfaring'] = [];
  if (raw.erfaring !== undefined && !Array.isArray(raw.erfaring)) {
    issues.push(issue('erfaring', 'Skal være en liste af job-blokke'));
  } else if (Array.isArray(raw.erfaring)) {
    erfaring = raw.erfaring.map((e, i) => {
      if (!isObj(e)) {
        issues.push(issue(`erfaring[${i}]`, 'Skal være et objekt med id og punkter'));
        return { id: '', punkter: [] as [string, string][] };
      }
      if (typeof e.id !== 'string' || !e.id.trim()) {
        issues.push(issue(`erfaring[${i}]`, 'Mangler job-id'));
      }
      return {
        id: typeof e.id === 'string' ? e.id : '',
        punkter: pairList(e.punkter, `erfaring[${i}].punkter`, issues),
      };
    });
  }

  const selection: CvSelection = {
    job: {
      firma: typeof job.firma === 'string' ? job.firma : '',
      titel: typeof job.titel === 'string' ? job.titel : '',
      dato: typeof job.dato === 'string' ? job.dato : '',
    },
    sprog: sprog === 'en' ? 'en' : 'da',
    ...(typeof raw.brandfarve === 'string' && HEX_RE.test(raw.brandfarve)
      ? { brandfarve: raw.brandfarve }
      : {}),
    titel: typeof raw.titel === 'string' ? raw.titel : '',
    profiltekst: typeof raw.profiltekst === 'string' ? raw.profiltekst : '',
    kompetencer: strList(raw.kompetencer, 'kompetencer', issues),
    erfaring,
    ...(typeof raw.reference_side1 === 'string' ? { reference_side1: raw.reference_side1 } : {}),
    ...(typeof raw.reference_efter === 'string' ? { reference_efter: raw.reference_efter } : {}),
    projekter: pairList(raw.projekter, 'projekter', issues),
    uddannelse: strList(raw.uddannelse, 'uddannelse', issues),
    oevrig: strList(raw.oevrig, 'oevrig', issues),
    referencer: strList(raw.referencer, 'referencer', issues),
    sprogfaerdigheder: strList(raw.sprogfaerdigheder, 'sprogfaerdigheder', issues),
  };

  return { selection, issues };
}
