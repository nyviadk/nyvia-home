import { SLUG_RE } from '../catalogue/field-spec';
import { CV_COLLECTIONS } from '../catalogue/registry';
import { issue, type CvIssue } from '../issues';
import type { CvOm, CvPerson, CvStil } from '../types';
import { CV_COLL_KEYS, type CvCollKey } from './cv-repos';

/**
 * Import og eksport af hele kataloget som ét JSON-dokument — samme form som
 * prototypens `cv-data.json`.
 *
 * Rent regnestykke uden Firestore og uden React: kan køres i Node med det rigtige
 * katalog og sammenlignes tegn for tegn. Det er dét, der gør fase 1 til noget man kan
 * godkende før der findes en eneste formular.
 */

type Doc = Record<string, unknown>;
type Collection = Record<string, Doc>;

/** Katalogets nuværende indhold, som skærmen læser det ud af storene. */
export type CvSnapshot = Record<CvCollKey, Collection>;

/**
 * Hvad der sker med posten.
 *
 * Importen TILFØJER kun. Findes id'et i forvejen, bliver posten stående som den er —
 * uanset om filen siger noget andet. `afviger` er derfor ikke "bliver opdateret", men
 * "her er filen og kataloget uenige, og kataloget vinder". Den skal man kunne se, ellers
 * tror man at ens rettelse i filen slog igennem.
 */
export type ImportStatus = 'ny' | 'afviger' | 'uændret';

export interface ImportRow {
  id: string;
  status: ImportStatus;
  data: Doc;
}

export interface ImportPlan {
  collections: { key: CvCollKey; rows: ImportRow[] }[];
  /** Kun sat når kataloget ikke har indstillinger endnu — de overskrives aldrig. */
  settings: { stil?: CvStil; person?: CvPerson; om?: CvOm } | null;
  issues: CvIssue[];
  ny: number;
  afviger: number;
  uaendret: number;
}

/**
 * App-bogholderi, ikke katalogdata. Udelades ved eksport og ignoreres i sammenligningen —
 * ellers ville hver eneste post stå som "erstatter", fordi tidsstemplerne altid er nye.
 *
 * `importId` hører med af nøjagtig samme grund: appen sætter det selv på hver importeret
 * post. Manglede det her, ville en fil man importerede og straks paste ind igen komme
 * tilbage som "afviger" på hver eneste post — appen ville fortælle brugeren at filen og
 * kataloget er uenige, om et felt brugeren aldrig har set.
 */
const BOOKKEEPING = ['id', 'createdAt', 'updatedAt', 'importId'];

/**
 * Felter appen selv styrer, men som IKKE er bogholderi.
 *
 * `orden` er rigtige data — det er den rækkefølge man selv har sat med pilene i listen — så
 * den skal med i både eksport og sammenligning. Den har bare ikke et formularfelt, fordi
 * "skriv et tal" var ubrugeligt at forholde sig til.
 *
 * Derfor står den her og ikke i registret: uden denne liste blev hver eneste importerede
 * post meldt som "Ukendt felt: orden", 51 gange i træk, om et felt brugeren aldrig har
 * skrevet — og med den forkerte påstand at det ville forsvinde ved næste rettelse.
 */
const APP_STYREDE = ['orden'];

const withoutBookkeeping = (doc: Doc): Doc =>
  Object.fromEntries(Object.entries(doc).filter(([k]) => !BOOKKEEPING.includes(k)));

/**
 * Stabil sammenligning uafhængig af nøglerækkefølge.
 *
 * `JSON.stringify` alene duer ikke: Firestore giver ikke nøgler tilbage i samme rækkefølge
 * som de blev skrevet, så to identiske dokumenter ville se forskellige ud.
 */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const entries = Object.entries(value as Doc)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}

/**
 * Felter der indeholder kontaktoplysninger. De er kendte, så der ledes ikke efter mønstre
 * i al tekst — et regex på mails og telefonnumre fanger også "2022-2024" og andet der bare
 * ligner.
 */
const CONTACT_FIELDS = ['email', 'telefon', 'kontakt'];

/**
 * Slør en kontaktoplysning uden at fjerne den.
 *
 * Formen bliver stående: man kan se AT der er en mail, og hvilket domæne den ligger på —
 * kun det personlige er væk. Tømte man feltet i stedet, ville modtageren af eksporten
 * hverken vide at oplysningen findes eller hvad den skal se ud som, og en genimport ville
 * efterlade hullet.
 *
 * Domænet beholdes, fordi det ikke er personligt og gør slutresultatet til at læse.
 */
function maskContact(value: string): string {
  const text = value.trim();
  if (!text) return value;

  const at = text.indexOf('@');
  if (at > 0) return `xxxx${text.slice(at)}`;

  // Telefonnummer: cifre bliver til x, mens landekode, mellemrum og tegn står.
  if (/\d/.test(text)) {
    const cc = /^(\+\d{1,3})\s*/.exec(text);
    const rest = cc ? text.slice(cc[0].length) : text;
    return `${cc ? `${cc[1]} ` : ''}${rest.replace(/\d/g, 'x')}`;
  }
  return text;
}

const maskContacts = (doc: Doc): Doc =>
  Object.fromEntries(
    Object.entries(doc).map(([k, v]) => [
      k,
      CONTACT_FIELDS.includes(k) && typeof v === 'string' ? maskContact(v) : v,
    ])
  );

/**
 * Kataloget som ét JSON-dokument.
 *
 * `redigeret: true` slører mails og telefonnumre. Det er standard, fordi eksporten typisk
 * ender på udklipsholderen og derfra i en samtale — og en CV-database indeholder både din
 * egen og dine referencers kontaktoplysninger.
 *
 * En sløret eksport kan IKKE bruges som sikkerhedskopi: `xxxx@gmail.com` kommer ikke
 * tilbage af sig selv. Det er derfor der er to knapper og ikke en afkrydsning man glemmer
 * at sætte.
 */
export function buildExport(
  snapshot: CvSnapshot,
  settings: { stil: CvStil; person: CvPerson; om: CvOm },
  opts: { redigeret: boolean } = { redigeret: true }
): string {
  const clean = (doc: Doc) =>
    opts.redigeret ? maskContacts(withoutBookkeeping(doc)) : withoutBookkeeping(doc);

  const out: Record<string, unknown> = {
    stil: settings.stil,
    person: clean(settings.person as unknown as Doc),
    om: settings.om,
  };
  for (const key of CV_COLL_KEYS) {
    out[key] = Object.fromEntries(
      Object.entries(snapshot[key])
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, doc]) => [id, clean(doc)])
    );
  }
  return JSON.stringify(out, null, 2);
}

const isObject = (v: unknown): v is Doc =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Læs en indsat blob og sammenhold den med det der allerede ligger.
 *
 * Kaster aldrig. Alt der ikke kan bruges, kommer med som en `CvIssue` — en import der
 * tavst sprang tre poster over ville være værre end en der nægtede at køre.
 */
export function parseImport(
  text: string,
  existing: CvSnapshot,
  /** Har kataloget allerede stil/person/om? Så røres de ikke. */
  hasSettings = false
): ImportPlan {
  const empty: ImportPlan = {
    collections: [],
    settings: null,
    issues: [],
    ny: 0,
    afviger: 0,
    uaendret: 0,
  };

  let blob: unknown;
  try {
    blob = JSON.parse(text);
  } catch (e) {
    return { ...empty, issues: [issue('hele filen', `Ikke gyldig JSON: ${(e as Error).message}`)] };
  }
  if (!isObject(blob)) {
    return { ...empty, issues: [issue('hele filen', 'Roden skal være et JSON-objekt')] };
  }

  const issues: CvIssue[] = [];
  const known = ['stil', 'person', 'om', ...CV_COLL_KEYS];
  for (const key of Object.keys(blob)) {
    if (!known.includes(key)) {
      issues.push(
        issue(key, `Hele afsnittet “${key}” hører ikke til kataloget og importeres ikke`, known)
      );
    }
  }

  const settingsInBlob = isObject(blob.stil) || isObject(blob.person) || isObject(blob.om);
  if (settingsInBlob && hasSettings) {
    issues.push(issue('stil / person / om', 'Findes allerede — importen overskriver ikke'));
  }
  const settings =
    settingsInBlob && !hasSettings
      ? {
          ...(isObject(blob.stil) ? { stil: blob.stil as unknown as CvStil } : {}),
          ...(isObject(blob.person) ? { person: blob.person as unknown as CvPerson } : {}),
          ...(isObject(blob.om) ? { om: blob.om as unknown as CvOm } : {}),
        }
      : null;

  const collections: ImportPlan['collections'] = [];
  let ny = 0;
  let afviger = 0;
  let uaendret = 0;

  for (const key of CV_COLL_KEYS) {
    const raw = blob[key];
    if (raw === undefined) continue;
    if (!isObject(raw)) {
      issues.push(issue(key, 'Skal være et objekt med ID som nøgle, ikke et array'));
      continue;
    }

    const kendteFelter = CV_COLLECTIONS[key].fields.map((f) => f.name);

    /**
     * Ukendte felter samles og meldes ÉN gang pr. feltnavn — ikke én gang pr. post.
     *
     * Uden det gav en helt almindelig import 51 identiske advarsler i træk, og de druknede
     * de to der faktisk betød noget. En liste man ikke kan læse, er lige så ubrugelig som
     * ingen liste.
     */
    const ukendtePrFelt = new Map<string, string[]>();

    const rows: ImportRow[] = [];
    for (const [id, doc] of Object.entries(raw)) {
      if (!isObject(doc)) {
        issues.push(issue(`${key}.${id}`, 'Posten er ikke et objekt'));
        continue;
      }
      /**
       * Id'et bliver til et Firestore-dokument-id. Et `/` i det gør stien til en KOLLEKTION
       * med ulige antal led, og så kaster `doc()` — batchen kører aldrig, og hele importen
       * fejler på grund af én post. En tom nøgle gør det samme. Store bogstaver skriver
       * fint, men kan ikke tastes konsistent i en selection bagefter.
       */
      if (!SLUG_RE.test(id)) {
        issues.push(
          issue(`${key}.${id || '(tom)'}`, 'Ugyldigt ID — kun små bogstaver, tal og _')
        );
        continue;
      }
      /**
       * Felter registret ikke kender, gemmes, men kan ikke ses eller rettes i appen — og
       * første gang man retter posten, skriver `writeWithSlug` med `merge: false` og de er
       * væk. Bedre at få det at vide ved importen end at opdage et hul måneder senere.
       *
       * `APP_STYREDE` er undtaget: `orden` sættes af appen selv og BEVARES eksplicit når en
       * post rettes, så både advarslen og dens påstand ville være forkerte.
       */
      for (const k of Object.keys(doc)) {
        if (kendteFelter.includes(k) || BOOKKEEPING.includes(k) || APP_STYREDE.includes(k)) {
          continue;
        }
        ukendtePrFelt.set(k, [...(ukendtePrFelt.get(k) ?? []), id]);
      }

      const before = existing[key]?.[id];
      const status: ImportStatus =
        before === undefined
          ? 'ny'
          : canonical(withoutBookkeeping(doc)) === canonical(withoutBookkeeping(before))
            ? 'uændret'
            : 'afviger';

      if (status === 'ny') ny++;
      else if (status === 'afviger') afviger++;
      else uaendret++;

      rows.push({ id, status, data: doc });
    }

    for (const [felt, ids] of ukendtePrFelt) {
      issues.push(
        issue(
          `${key} · ${felt}`,
          `Appen har ikke et felt der hedder “${felt}”. Det importeres og ligger i databasen, men du kan hverken se eller rette det — og det bliver slettet første gang du gemmer en af de ${ids.length} ${ids.length === 1 ? 'post' : 'poster'}`,
          kendteFelter
        )
      );
    }

    if (rows.length) collections.push({ key, rows });
  }

  return { collections, settings, issues, ny, afviger, uaendret };
}
