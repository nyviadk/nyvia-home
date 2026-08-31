import { T } from '../i18n';
import type { CvLang, CvText } from '../types';
import type { CvCollKey } from '../data/cv-repos';
import type { CvFieldSpec } from './field-spec';

/**
 * Én beskrivelse pr. kollektion: hvilke felter den har, og hvordan en række læses.
 *
 * Det er den eneste fil der skal røres når et felt kommer til — liste, formular og
 * validering følger med af sig selv.
 */
export interface CvCollectionDef {
  fields: CvFieldSpec[];
  /** Rækkens overskrift i listen. */
  title: (doc: Record<string, unknown>, lang: CvLang) => string;
  /** Linjen under. Tom hvis der ikke er noget at sige. */
  subtitle: (doc: Record<string, unknown>, lang: CvLang) => string;
}

const t = (doc: Record<string, unknown>, key: string, lang: CvLang) =>
  T(doc[key] as CvText | undefined, lang);

const s = (doc: Record<string, unknown>, key: string) =>
  typeof doc[key] === 'string' ? (doc[key] as string) : '';

/** `til: null` betyder stadig i gang. */
const periode = (doc: Record<string, unknown>) => {
  const fra = s(doc, 'fra');
  const til = doc.til === null || doc.til === undefined || doc.til === '' ? 'nu' : s(doc, 'til');
  return fra ? `${fra}–${til}` : '';
};

/**
 * `orden` er IKKE et felt man udfylder.
 *
 * Det er en position, ikke et tal — og et frit talfelt efterlader én med spørgsmålet "hvad
 * skriver jeg så, 7?". Nye poster lægges sidst automatisk, og rækkefølgen flyttes med
 * pilene i listen, som renummererer hele kollektionen 1..n i én batch.
 */
export const CV_COLLECTIONS: Record<CvCollKey, CvCollectionDef> = {
  jobs: {
    fields: [
      { kind: 'text', name: 'firma', label: 'Firma', required: true, placeholder: 'My Planio ApS' },
      { kind: 'text', name: 'sted', label: 'Sted', placeholder: 'Aarhus' },
      { kind: 'text', name: 'fra', label: 'Fra', required: true, placeholder: '2022' },
      { kind: 'nullable', name: 'til', label: 'Til', placeholder: '2024 — lad stå tom hvis du stadig er der' },
      { kind: 'i18n', name: 'rolle', label: 'Rolle', required: true, placeholder: 'Lead Developer & medstifter' },
      { kind: 'i18n', name: 'note', label: 'Note', multiline: true, placeholder: 'Startet som sideprojekt i 2022. Stiftet som ApS i 2025.' },
    ],
    title: (d) => s(d, 'firma'),
    subtitle: (d, l) => [t(d, 'rolle', l), periode(d)].filter(Boolean).join(' · '),
  },

  punkter: {
    fields: [
      { kind: 'ref', name: 'job', label: 'Job', coll: 'jobs', required: true },
      {
        kind: 'text',
        name: 'sandhed',
        label: 'Sandhed',
        required: true,
        placeholder: 'Envelope encryption, AES-256-GCM, Zero-Knowledge',
      },
      { kind: 'variants', name: 'varianter', label: 'Varianter' },
    ],
    title: (d) => s(d, 'sandhed'),
    subtitle: (d) => {
      const n = Object.keys((d.varianter ?? {}) as object).length;
      return `${s(d, 'job')} · ${n} ${n === 1 ? 'variant' : 'varianter'}`;
    },
  },

  projekter: {
    fields: [
      { kind: 'text', name: 'navn', label: 'Navn', required: true, placeholder: 'NyviaEvi' },
      { kind: 'text', name: 'aar', label: 'År', placeholder: '2025' },
      { kind: 'text', name: 'link', label: 'Link', placeholder: 'nyvia.dk' },
      { kind: 'bool', name: 'aabenkilde', label: 'Åben kilde' },
      {
        kind: 'text',
        name: 'sandhed',
        label: 'Sandhed',
        required: true,
        placeholder: 'Multi-tenant SaaS, Next.js 15 + Cloudflare Workers',
      },
      { kind: 'variants', name: 'varianter', label: 'Varianter' },
    ],
    title: (d) => s(d, 'navn'),
    subtitle: (d) => [s(d, 'aar'), s(d, 'sandhed')].filter(Boolean).join(' · '),
  },

  grupper: {
    fields: [
      { kind: 'i18n', name: 'navn', label: 'Navn', required: true, placeholder: 'Backend & cloud' },
    ],
    title: (d, l) => t(d, 'navn', l),
    subtitle: () => '',
  },

  kompetencer: {
    fields: [
      {
        kind: 'i18n',
        name: 'navn',
        label: 'Navn',
        required: true,
        placeholder: 'React Native (Expo)',
      },
      { kind: 'ref', name: 'gruppe', label: 'Gruppe', coll: 'grupper', required: true },
    ],
    title: (d, l) => t(d, 'navn', l),
    subtitle: (d) => s(d, 'gruppe'),
  },

  uddannelse: {
    fields: [
      {
        kind: 'i18n',
        name: 'grad',
        label: 'Grad',
        required: true,
        placeholder: 'Multimediedesigner',
      },
      { kind: 'i18n', name: 'sted', label: 'Sted', placeholder: 'Erhvervsakademi Aarhus' },
      { kind: 'text', name: 'fra', label: 'Fra', placeholder: '2022' },
      { kind: 'text', name: 'til', label: 'Til', placeholder: '2024' },
      {
        kind: 'i18n',
        name: 'note',
        label: 'Note',
        multiline: true,
        placeholder: 'Frontend, UX/UI, agil udvikling. Afsluttet med karakteren 12.',
      },
    ],
    title: (d, l) => t(d, 'grad', l),
    subtitle: (d, l) => [t(d, 'sted', l), periode(d)].filter(Boolean).join(' · '),
  },

  referencer: {
    fields: [
      { kind: 'text', name: 'navn', label: 'Navn', required: true, placeholder: 'Michael Jensen' },
      {
        kind: 'i18n',
        name: 'titel',
        label: 'Titel',
        placeholder: 'Senior softwareudvikler, Salling Group — faglig mentor',
      },
      { kind: 'text', name: 'kontakt', label: 'Kontakt', placeholder: 'michael@eksempel.dk' },
      { kind: 'text', name: 'periode', label: 'Periode', placeholder: '2024 – nu' },
    ],
    title: (d) => s(d, 'navn'),
    subtitle: (d, l) => [t(d, 'titel', l), s(d, 'periode')].filter(Boolean).join(' · '),
  },

  sprogfaerdigheder: {
    fields: [
      { kind: 'i18n', name: 'navn', label: 'Sprog', required: true, placeholder: 'Dansk' },
      { kind: 'i18n', name: 'niveau', label: 'Niveau', placeholder: 'modersmål' },
    ],
    title: (d, l) => t(d, 'navn', l),
    subtitle: (d, l) => t(d, 'niveau', l),
  },
};

/**
 * Sortering i listen. `orden` hvis den findes, ellers id — en post uden `orden` skal
 * stadig kunne ses, og skal ligge et forudsigeligt sted.
 */
export function sortDocs<T extends { id: string }>(docs: readonly T[]): T[] {
  return [...docs].sort((a, b) => {
    const ao = (a as unknown as { orden?: number }).orden;
    const bo = (b as unknown as { orden?: number }).orden;
    if (typeof ao === 'number' && typeof bo === 'number') return ao - bo;
    if (typeof ao === 'number') return -1;
    if (typeof bo === 'number') return 1;
    return a.id.localeCompare(b.id, 'da');
  });
}
