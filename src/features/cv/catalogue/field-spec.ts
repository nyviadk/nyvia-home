import { fromStoredText, toStoredText } from '../i18n';
import { normalizeLink, type CvText } from '../types';
import type { CvCollKey } from '../data/cv-repos';

/**
 * Hvad ét felt er, og hvordan det redigeres.
 *
 * De ni kollektioner er ikke ni forskellige skærme — de er ni FELTLISTER. Beskriver man
 * felterne som data, bliver liste, formular og validering ét sæt kode i stedet for ni.
 * Alternativet var 27 næsten ens skærme, som ville drive fra hinanden ved første rettelse.
 */
interface FieldBase {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export type CvFieldSpec =
  | (FieldBase & { kind: 'text' })
  | (FieldBase & { kind: 'i18n'; multiline?: boolean })
  | (FieldBase & { kind: 'number' })
  | (FieldBase & { kind: 'bool' })
  /** Peger på et id i en anden kollektion, fx `punkt.job`. */
  | (FieldBase & { kind: 'ref'; coll: CvCollKey })
  /** `Record<variant, CvText>` — samme faktum, forskellig vinkel. */
  | (FieldBase & { kind: 'variants' })
  /** Liste af korte strenge. */
  | (FieldBase & { kind: 'strlist' })
  /** Links med både tekst og adresse — begge dele skal med for at det er et link. */
  | (FieldBase & { kind: 'links' })
  /** Billede der vælges og uploades. Gemmer en download-URL. */
  | (FieldBase & { kind: 'image' })
  /** Tekst der må være tom OG betyder noget når den er det, fx `job.til` = "nu". */
  | (FieldBase & { kind: 'nullable' });

/** Formularens værdi for ét felt. Aldrig `CvText` — unionen holdes ude af UI'et. */
export type FieldValue =
  | { t: 'text'; v: string }
  | { t: 'i18n'; da: string; en: string }
  | { t: 'bool'; v: boolean }
  | { t: 'list'; v: string[] }
  | { t: 'links'; v: { tekst: string; url: string }[] }
  | { t: 'variants'; v: { key: string; da: string; en: string }[] };

export type FieldValues = Record<string, FieldValue>;

const asText = (v: unknown): string =>
  v === null || v === undefined ? '' : typeof v === 'string' ? v : String(v);

/** Tom værdi for et felt — bruges når man opretter en ny post. */
export function emptyValue(spec: CvFieldSpec): FieldValue {
  switch (spec.kind) {
    case 'i18n':
      return { t: 'i18n', da: '', en: '' };
    case 'bool':
      return { t: 'bool', v: false };
    case 'strlist':
      return { t: 'list', v: [] };
    case 'links':
      return { t: 'links', v: [] };
    case 'variants':
      return { t: 'variants', v: [] };
    default:
      return { t: 'text', v: '' };
  }
}

/** Læs et dokument ind i formularens værdier. */
export function valueFromDoc(spec: CvFieldSpec, doc: Record<string, unknown> | undefined): FieldValue {
  const raw = doc?.[spec.name];
  if (raw === undefined && spec.kind !== 'bool') return emptyValue(spec);

  switch (spec.kind) {
    case 'i18n':
      return { t: 'i18n', ...fromStoredText(raw as CvText) };
    case 'bool':
      return { t: 'bool', v: raw === true };
    case 'strlist':
      return { t: 'list', v: Array.isArray(raw) ? raw.map(asText) : [] };
    case 'links':
      return {
        t: 'links',
        v: (Array.isArray(raw) ? raw : [])
          .map(normalizeLink)
          .filter((l): l is { tekst: string; url: string } => l !== null),
      };
    case 'variants': {
      const map = (raw ?? {}) as Record<string, CvText>;
      return {
        t: 'variants',
        v: Object.entries(map).map(([key, value]) => ({ key, ...fromStoredText(value) })),
      };
    }
    default:
      return { t: 'text', v: asText(raw) };
  }
}

const isBlank = (value: FieldValue): boolean => {
  switch (value.t) {
    case 'text':
      return value.v.trim() === '';
    /**
     * BEGGE sprog skal være tomme. Så længe der kun blev kigget på `da`, blev et felt man
     * kun havde skrevet på engelsk udeladt af dokumentet uden et ord — teksten var væk,
     * og der stod "Gemt".
     */
    case 'i18n':
      return value.da.trim() === '' && value.en.trim() === '';
    case 'list':
      return value.v.length === 0;
    case 'links':
      return value.v.length === 0;
    case 'variants':
      return value.v.length === 0;
    case 'bool':
      return false;
  }
};

/**
 * Formularens værdier tilbage til et dokument.
 *
 * Tomme valgfrie felter udelades HELT frem for at gemmes som tom streng: Firestore afviser
 * `undefined`, og et felt der er sat til `""` kan ikke skelnes fra et der aldrig blev
 * udfyldt. `nullable` er undtagelsen — dér BETYDER tom noget ("stadig ansat"), og gemmes
 * derfor eksplicit som `null`.
 */
export function docFromValues(
  specs: readonly CvFieldSpec[],
  values: FieldValues
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const spec of specs) {
    const value = values[spec.name] ?? emptyValue(spec);

    if (spec.kind === 'nullable') {
      const text = value.t === 'text' ? value.v.trim() : '';
      out[spec.name] = text === '' ? null : text;
      continue;
    }
    if (spec.kind === 'bool') {
      if (value.t === 'bool' && value.v) out[spec.name] = true;
      continue;
    }
    if (isBlank(value) && !spec.required) continue;

    switch (value.t) {
      case 'text':
        out[spec.name] = spec.kind === 'number' ? Number(value.v.replace(',', '.')) : value.v.trim();
        break;
      case 'i18n':
        out[spec.name] = toStoredText(value.da, value.en);
        break;
      case 'list':
        out[spec.name] = value.v.map((s) => s.trim()).filter(Boolean);
        break;
      case 'links':
        out[spec.name] = value.v
          .map((l) => normalizeLink(l))
          .filter((l): l is { tekst: string; url: string } => l !== null);
        break;
      case 'variants':
        // Kun rækker man er begyndt på og ikke gjort færdig, ryger her — og dem har
        // `validateValues` allerede stoppet, så Gem er ikke tilgængelig med sådan en.
        out[spec.name] = Object.fromEntries(
          value.v
            .filter((row) => row.key.trim() && (row.da.trim() || row.en.trim()))
            .map((row) => [row.key.trim(), toStoredText(row.da, row.en)])
        );
        break;
      case 'bool':
        break;
    }
  }
  return out;
}

/** Er feltet tomt? Eksporteret, fordi valideringen bruger samme regel som skriveren. */
export const isFieldBlank = isBlank;

/** Slug-reglen. Id'et står i selectionen og i menuen, så det skal kunne læses og tastes. */
export const SLUG_RE = /^[a-z0-9_]+$/;

/** Forslag til et id ud fra et navn — æøå og mellemrum ned til noget der kan skrives. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}
