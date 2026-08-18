import type { SpeechAccent } from '@/lib/speech/accent';

/**
 * Tre slags materiale, fordi de testes forskelligt:
 * - `ord` og `saetning` har ét facit man kan skrive → tekstfelt + rigtigt/forkert.
 * - `regel` har ikke ét svar man kan taste → overskrift → "Vis forklaring", uden scoring.
 */
export type SpanishKind = 'ord' | 'regel' | 'saetning';

export const SPANISH_KINDS: { value: SpanishKind; label: string }[] = [
  { value: 'ord', label: 'Ord' },
  { value: 'saetning', label: 'Sætninger' },
  { value: 'regel', label: 'Regler' },
];

/** Testens retning. 'mixed' vælger tilfældigt pr. kort. */
export type QuizDirection = 'da-es' | 'es-da' | 'mixed';

export const QUIZ_DIRECTIONS: { value: QuizDirection; label: string }[] = [
  { value: 'da-es', label: 'DA → ES' },
  { value: 'es-da', label: 'ES → DA' },
  { value: 'mixed', label: 'Blandet' },
];

export const ACCENTS: { value: SpeechAccent; label: string }[] = [
  { value: 'es-ES', label: 'Spanien' },
  { value: 'es-MX', label: 'Latinamerika' },
];

/** Et billede i Storage. Samme form som syns-fotos, så oprydningen kan genbruges. */
export interface SpanishImage {
  /** Storage-stien — nødvendig for at kunne slette filen igen. */
  path: string;
  url: string;
}

// type-alias (ikke interface) → tildelbar til Record<string, unknown> for db-facaden.
export type SpanishEntry = {
  kind: SpanishKind;
  /** Dansk side. For `regel` er det overskriften, fx "ser vs. estar". */
  da: string;
  /** Spansk side. For `regel` er det den (danske) forklaring — se `isSpanishText`. */
  es: string;
  /**
   * Udtale skrevet med danske bogstaver, fx `bwe-nos di-as`. Valgfri.
   *
   * Den er IKKE en erstatning for oplæsningen — den er til at kunne kigge på mens man hører,
   * og til at kunne læse højt uden lyd på. Den bruges også som hint i testen, fordi udtalen
   * røber lyden uden at røbe stavemåden.
   */
  pron?: string;
  /** Fri note — vises altid sammen med svaret. */
  note?: string;
  images?: SpanishImage[];
  createdAt: string;
  updatedAt: string;
};

export type SpanishEntryInput = Pick<SpanishEntry, 'kind' | 'da' | 'es' | 'pron' | 'note'>;

/**
 * Etiketterne skifter med typen. En regel har ikke en "dansk" og en "spansk" side — den har
 * en overskrift og en forklaring. Overskriften må gerne være et spørgsmål, men skal ikke
 * tvinges til det: mange regler er bare en liste (fx uregelmæssige verber).
 */
export function sideLabels(kind: SpanishKind): { da: string; es: string } {
  return kind === 'regel'
    ? { da: 'Overskrift', es: 'Forklaring' }
    : { da: 'Dansk', es: 'Spansk' };
}

/**
 * Er `es`-feltet reelt spansk tekst der kan læses op i sin helhed?
 *
 * For ord og sætninger: ja. For en REGEL er feltet en dansk forklaring (med spanske
 * eksempler i), så en oplæsning af hele teksten med spansk stemme ville være volapyk.
 * Enkelte ord kan man stadig trykke på — det er dér de spanske eksempler sidder.
 */
export const isSpanishText = (kind: SpanishKind) => kind !== 'regel';
