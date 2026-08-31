import { T } from '../i18n';
import type { CvSnapshot } from '../data/catalogue-io';
import type { CvText } from '../types';

/**
 * Prompten der forvandler løs tekst til importerbar JSON.
 *
 * ⚠️ Den siger det MODSATTE af `MENU_RULES`, og det er med vilje. Menuen bruges til at VÆLGE
 * blandt det der findes ("brug udelukkende ID'er herfra"). Her skal der OPRETTES noget nyt,
 * så nye ID'er er hele opgaven. Blandes de to sammen, går det galt: en samtale nægtede at
 * tilføje kompetencer, fordi den havde fået menuens regel og troede den kun måtte bruge de
 * 31 ID'er der allerede stod der.
 *
 * Derfor står de eksisterende ID'er her som "OPTAGET" og ikke som "vælg blandt disse".
 */

const ids = (coll: Record<string, unknown>) => Object.keys(coll).sort().join(' ') || '(ingen)';

/**
 * Hvor mange punkter hvert job må have, og hvor lange.
 *
 * Står her og ikke i kataloget, fordi det er en redaktionel beslutning om CV'et — ikke et
 * faktum om jobbet. Nøglen er job-id'et.
 */
const PUNKT_LOFT: Record<string, string> = {
  myplanio: 'højst 3 punkter, hver på 1–2 linjer',
  brandbyhand: 'højst 1 punkt på 1–2 linjer',
};

export function buildImportPrompt(snapshot: CvSnapshot): string {
  const jobLinjer = Object.entries(snapshot.jobs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, doc]) => {
      const navn = [T(doc.rolle as CvText, 'da'), doc.firma].filter(Boolean).join(' · ');
      const loft = PUNKT_LOFT[id];
      return `    ${id.padEnd(20)} ${navn}${loft ? `   ⚠ ${loft}` : ''}`;
    })
    .join('\n');

  const gruppeLinjer = Object.entries(snapshot.grupper)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, doc]) => `    ${id.padEnd(20)} ${T(doc.navn as CvText, 'da')}`)
    .join('\n');

  return `Du skal lave et stykke JSON jeg kan importere i mit CV-katalog.

Jeg giver dig noget tekst nedenfor — punkter jeg har lavet, kompetencer jeg kan, eller
lignende. Din opgave er at omsætte den til JSON i formatet herunder.

OPRET GERNE NYE ID'ER. Det er hele opgaven. (Hvis du har set en "brug udelukkende ID'er
herfra"-regel i en anden sammenhæng: den gælder når man VÆLGER til et konkret CV, ikke her.)

ID-REGLER
  Kun små bogstaver, tal og _   (regex: ^[a-z0-9_]+$)
  Læsbart, ikke tilfældigt: mp_kryptering, ikke k3f9x2m1
  Punkter præfikses med jobbets forbogstaver: mp_ for myplanio, bh_ for brandbyhand
  Må IKKE være et af de optagede id'er nederst — så bliver posten sprunget over

TEKSTFELTER
  Enten én streng (samme på dansk og engelsk) eller {"da": "...", "en": "..."}.
  Skriv kun et par når oversættelsen faktisk er forskellig.

JOBS DER FINDES — punkter skal pege på ét af disse id'er i feltet "job"
${jobLinjer}

KOMPETENCEGRUPPER DER FINDES — kompetencer skal pege på ét af disse id'er i "gruppe"
${gruppeLinjer}

FORMAT — tag kun de afsnit med, du faktisk har noget til
{
  "punkter": {
    "mp_kryptering": {
      "job": "myplanio",
      "sandhed": "Kort, faktuelt. Vises når jeg vælger punkter — ikke i CV'et.",
      "varianter": {
        "teknisk": "Formuleringen med vægt på teknikken.",
        "forretning": {"da": "Med vægt på værdien.", "en": "Focused on the value."},
        "kort": "En kort udgave til når der er lidt plads."
      }
    }
  },
  "kompetencer": {
    "sql": { "navn": "SQL", "gruppe": "backend" }
  },
  "grupper": {
    "data": { "navn": {"da": "Data & analyse", "en": "Data & analytics"} }
  },
  "projekter": {
    "mitprojekt": {
      "navn": "Mit Projekt",
      "aar": "2025",
      "aabenkilde": true,
      "link": "eksempel.dk",
      "sandhed": "Kort faktuelt.",
      "varianter": { "teknisk": "...", "kort": "..." }
    }
  }
}

REGLER FOR INDHOLDET
  Hvert punkt SKAL have mindst én variant — et punkt uden varianter kan ikke bruges.
  Variantnavne er frie (teknisk, forretning, kort, ledelse …). Brug de samme navne på
  tværs, så de er til at vælge imellem.
  "sandhed" er det faktuelle indhold uden vinkel. Det er dét jeg ser når jeg vælger.
  Digt ikke. Står der ikke et tal, en teknologi eller et resultat i min tekst, så skriv
  det ikke. Er du i tvivl om noget, så skriv det som et spørgsmål UNDER JSON'en.
  Svar med JSON'en i én kodeblok, og intet andet før den.

OPTAGEDE ID'ER — vælg noget andet
  jobs: ${ids(snapshot.jobs)}
  punkter: ${ids(snapshot.punkter)}
  projekter: ${ids(snapshot.projekter)}
  grupper: ${ids(snapshot.grupper)}
  kompetencer: ${ids(snapshot.kompetencer)}
  uddannelse: ${ids(snapshot.uddannelse)}
  referencer: ${ids(snapshot.referencer)}
  sprogfaerdigheder: ${ids(snapshot.sprogfaerdigheder)}

MIN TEKST:
`;
}
