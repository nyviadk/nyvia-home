/**
 * Parser for indsatte gloselister på formen
 *
 *   Buenos días (bwe-nos di-as) – Godmorgen
 *
 * Formatet er ikke opfundet til lejligheden: det er præcis sådan man i forvejen skriver en
 * ordliste ned i en note eller får den fra en lærebog. At skulle taste tyve gloser ind én
 * ad gangen i en formular er den slags arbejde man aldrig får gjort.
 */
export interface ParsedEntry {
  es: string;
  pron?: string;
  da: string;
}

export interface SkippedLine {
  line: string;
  reason: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  skipped: SkippedLine[];
}

/** Nummerering og punkttegn fra en kopieret liste — `1.`, `12)`, `-`, `*`, `•`. */
const LEADING_BULLET = /^\s*(?:\d+\s*[.)]|[-*•])\s+/;

/**
 * Adskiller mellem spansk og dansk. Både tankestreg, halvlang streg og bindestreg optræder
 * i praksis, alt efter hvor listen kommer fra.
 */
const SEPARATORS = ['–', '—', '-'];

/**
 * Find adskilleren.
 *
 * Den skal have mellemrum omkring sig OG stå uden for parenteser. Begge dele er nødvendige:
 * udtalen er fuld af bindestreger (`bwe-nos di-as`), og en post som
 * `Perdón / Disculpe (pr.-don / dis-kul-pe) – Undskyld mig` har en bindestreg både inde i
 * parentesen og som en del af et ord. Uden parentes-tællingen ville linjen blive hugget
 * midt i udtalen.
 *
 * Første fund vinder: den danske side må gerne selv indeholde en tankestreg.
 */
function splitSides(line: string): [string, string] | null {
  let depth = 0;
  for (let i = 1; i < line.length - 1; i++) {
    const ch = line[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (
      depth === 0 &&
      SEPARATORS.includes(ch) &&
      /\s/.test(line[i - 1]) &&
      /\s/.test(line[i + 1])
    ) {
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }
  }
  return null;
}

/** Sidste parentes-gruppe på den spanske side er udtalen. */
function splitPron(text: string): { es: string; pron?: string } {
  const match = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(text);
  if (!match) return { es: text };
  const es = match[1].trim();
  const pron = match[2].trim();
  // En tom parentes, eller en linje der KUN er en parentes, er ikke en udtale.
  return es && pron ? { es, pron } : { es: text };
}

export function parseEntries(input: string): ParseResult {
  const entries: ParsedEntry[] = [];
  const skipped: SkippedLine[] = [];

  for (const raw of input.split('\n')) {
    const line = raw.replace(LEADING_BULLET, '').trim();
    if (!line) continue;

    const sides = splitSides(line);
    if (!sides) {
      skipped.push({ line, reason: 'Mangler “–” mellem spansk og dansk' });
      continue;
    }

    const [left, da] = sides;
    const { es, pron } = splitPron(left);
    if (!es || !da) {
      skipped.push({ line, reason: 'Den ene side er tom' });
      continue;
    }

    entries.push({ es, da, ...(pron ? { pron } : {}) });
  }

  return { entries, skipped };
}

/**
 * Nøgle til dubletkontrol. Samme normalisering som svar-sammenligningen i testen, så to
 * poster der ville tælle som det samme svar også regnes for den samme post.
 */
export const dedupeKey = (es: string) => es.trim().replace(/\s+/g, ' ').toLowerCase();
