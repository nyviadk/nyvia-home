import { todayISODate } from '@/lib/datetime';
import type { CvSelection } from './selection';

/**
 * Standard-CV'et man starter fra, og reglen for hvordan en selection skrives ud.
 *
 * Ren tekst-i-tekst-ud. Der var en gang en struktureret liste-editor oven på det her; den
 * blev pillet ned igen, fordi det var mere besværligt at klikke sig gennem end at rette i
 * JSON'en. Det der blev tilbage, er dét der faktisk manglede: et rigtigt udgangspunkt.
 */

/**
 * Det almindelige CV — dét man sender når intet særligt taler imod det.
 *
 * En TOM skabelon stod her før, og den var ikke til megen hjælp: man skulle stadig slå
 * hvert eneste id op i menuen for at komme i gang. Her er et færdigt CV man retter i, og
 * `firma` er med vilje tomt — det er det ene felt der ALTID skal skrives.
 *
 * Datoen sættes fra uret og ikke som en fast streng. En hårdkodet dato ville stille og
 * roligt blive forkert, og den ender i arkivet som "hvornår sendte jeg den her".
 *
 * ⚠️ Id'erne peger ind i kataloget. Er en post slettet eller omdøbt, siger valideringen
 * det højlydt med en liste over hvad der findes — den forsvinder ikke i tavshed.
 */
export function standardSelection(): CvSelection {
  return {
    job: { firma: '', titel: 'Full-Stack Udvikler', dato: todayISODate() },
    sprog: 'da',
    brandfarve: '#0ea5e9',
    titel: 'Full-Stack Udvikler med React Native og Next.js ekspertise',
    profiltekst:
      'Engageret Lead Developer med stor erfaring i at bygge applikationer fra idé til ' +
      'produktion. Jeg har en stærk profil inden for frontend, backend og cloud-arkitektur. ' +
      'Med min baggrund som iværksætter forstår jeg både teknikken og forretningen bag et ' +
      'succesfuldt produkt. Jeg motiveres af at skabe brugervenlige og sikre løsninger, der ' +
      'skaber værdi for slutbrugeren.',
    kompetencer: [
      'react', 'rn', 'next', 'ts', 'js', 'tailwind',
      'node', 'firebase', 'gcp', 'cloudflare', 'rest', 'php',
      'git', 'eas', 'vercel', 'prismic', 'wordpress', 'shopify',
    ],
    erfaring: [
      {
        id: 'myplanio',
        punkter: [
          ['mp_app', 'teknisk'],
          ['mp_arkitektur', 'teknisk'],
          ['mp_kryptering', 'teknisk'],
        ],
      },
      { id: 'brandbyhand', punkter: [['bh_kunder', 'teknisk']] },
    ],
    reference_side1: 'michael',
    reference_efter: 'myplanio',
    projekter: [
      ['nyviaevi', 'teknisk'],
      ['nyvianexus', 'teknisk'],
    ],
    uddannelse: ['pba', 'mmd'],
    oevrig: ['skattespecialisten', 'annes', 'netto'],
    referencer: ['ebbe', 'anne'],
    sprogfaerdigheder: ['dansk', 'engelsk'],
  };
}

/**
 * Selection → JSON i SAMME nøglerækkefølge som specifikationens eksempel.
 *
 * Rækkefølgen er ikke pynt: det er den samme tekst man paster ind og ud, og en fil hvor
 * nøglerne flytter sig, kan man ikke sammenligne to udgaver af med øjnene. Tomme valgfrie
 * felter udelades helt — et tomt `reference_side1` ville udløse en valideringsfejl om et
 * felt man ikke har rørt.
 */
export function selectionTilJson(sel: CvSelection): string {
  const ud: Record<string, unknown> = {
    job: sel.job,
    sprog: sel.sprog,
    ...(sel.brandfarve ? { brandfarve: sel.brandfarve } : {}),
    titel: sel.titel,
    profiltekst: sel.profiltekst,
    kompetencer: sel.kompetencer,
    erfaring: sel.erfaring,
    ...(sel.reference_side1 ? { reference_side1: sel.reference_side1 } : {}),
    ...(sel.reference_efter ? { reference_efter: sel.reference_efter } : {}),
    projekter: sel.projekter,
    uddannelse: sel.uddannelse,
    oevrig: sel.oevrig,
    referencer: sel.referencer,
    sprogfaerdigheder: sel.sprogfaerdigheder,
  };
  return JSON.stringify(ud, null, 2);
}
