/**
 * CV-kataloget: ét sted hvor alt hvad du har lavet står én gang.
 *
 * Kataloget er sandheden; et CV er et UDTRÆK af det. Derfor er der ingen felter her der
 * hører til en bestemt ansøgning — den slags bor i selectionen. Det er dét, der gør at
 * fakta ikke kan skride fra ansøgning til ansøgning.
 */

/**
 * Et tekstfelt er enten ÉN streng (samme på dansk og engelsk) eller et par.
 *
 * Den korte form er ikke en optimering, den er en påstand: "det her hedder det samme på
 * begge sprog". Gemmer man altid et par, kan man ikke skelne mellem "ikke oversat endnu"
 * og "skal ikke oversættes". Kollapsreglen bor ét sted, i `i18n.ts`.
 */
export type CvText = string | { da: string; en: string };

export type CvLang = 'da' | 'en';

/** Sprog man kan rendere i. `begge` findes ikke — se planens afvigelse 3. */
export const CV_LANGS: { value: CvLang; label: string }[] = [
  { value: 'da', label: 'Dansk' },
  { value: 'en', label: 'Engelsk' },
];

// ---- Katalogets kollektioner ------------------------------------------------
// type-alias (ikke interface) → tildelbar til Record<string, unknown> for db-facaden.

export type CvJob = {
  orden: number;
  firma: string;
  sted: string;
  fra: string;
  /** `null` = stadig ansat. Renderes som "nu". */
  til: string | null;
  rolle: CvText;
  note?: CvText;
  createdAt: string;
  updatedAt: string;
};

/**
 * Ét punkt under et job.
 *
 * Ligger FLADT med et `job`-felt frem for nestet inde i jobbet. Så kan ét punkt rettes
 * uden at skrive hele jobbet om — og et punkt kan flyttes til et andet job ved at ændre
 * ét felt.
 */
export type CvPunkt = {
  job: string;
  /** Det faktuelle indhold, uafhængigt af vinkel. Vises i menuen — ikke varianterne. */
  sandhed: string;
  /**
   * Samme faktum, forskellig vinkel: teknisk, forretning, kort, ledelse.
   *
   * Nøglerne er frie — kataloget bestemmer selv hvilke vinkler der findes. Valideringen
   * lister derfor de varianter der FINDES når en selection beder om en der ikke gør.
   */
  varianter: Record<string, CvText>;
  createdAt: string;
  updatedAt: string;
};

export type CvProjekt = {
  orden: number;
  navn: string;
  aar: string;
  aabenkilde?: boolean;
  link?: string;
  sandhed: string;
  varianter: Record<string, CvText>;
  createdAt: string;
  updatedAt: string;
};

export type CvGruppe = {
  orden: number;
  navn: CvText;
  createdAt: string;
  updatedAt: string;
};

export type CvKompetence = {
  orden: number;
  navn: string;
  /** Id på en `CvGruppe`. */
  gruppe: string;
  createdAt: string;
  updatedAt: string;
};

export type CvUddannelse = {
  orden: number;
  grad: CvText;
  sted: CvText;
  fra: string;
  til: string;
  note?: CvText;
  createdAt: string;
  updatedAt: string;
};

export type CvReference = {
  orden: number;
  navn: string;
  titel: CvText;
  kontakt: string;
  periode: string;
  createdAt: string;
  updatedAt: string;
};

export type CvSprog = {
  orden: number;
  navn: string;
  niveau: CvText;
  createdAt: string;
  updatedAt: string;
};

/**
 * En afsendt ansøgning.
 *
 * `selection` gemmes som RÅ streng og ikke som et parset objekt. Om et halvt år skal man
 * kunne se præcis hvad man sendte — ikke vores fortolkning af det. Samme begrundelse som
 * `PlanioRaw.text`.
 */
export type CvAnsoegning = {
  firma: string;
  titel: string;
  /** ISO-dag. Kommer fra selectionens `job.dato`, ikke fra uret. */
  dato: string;
  sprog: CvLang;
  selection: string;
  /** Farven der faktisk blev brugt — selectionens, eller standarden hvis den var tom. */
  brandfarve: string;
  /**
   * Håndrettelser til netop denne ansøgning, som JSON-streng.
   *
   * Som streng og ikke som et map, af samme grund som `selection`: dokumentet skal kunne
   * læses om et halvt år uden at appens nuværende typer bestemmer hvad der står i det.
   */
  rettelser?: string;
  createdAt: string;
  updatedAt: string;
};

/** Det man selv fylder ud. Tidsstemplerne sætter repository-laget. */
export type CvAnsoegningInput = Omit<CvAnsoegning, 'createdAt' | 'updatedAt'>;

/**
 * Standard-CV'et: den selection man starter fra når intet særligt taler imod det.
 *
 * Sit EGET dokument og ikke et felt i indstillingerne. Indstillingsskærmen skriver hele
 * sit dokument med `merge: false` — et felt den ikke kender til, ville blive slettet hver
 * gang man rettede sit telefonnummer. Præcis den tavse forsvinden vi har jaget hele vejen.
 *
 * Gemmes som RÅ streng, som ansøgningerne: det er dét man indsatte, ikke vores fortolkning.
 */
export type CvStandard = { selection: string; updatedAt: string };

/**
 * En kørt import.
 *
 * Findes for at en fejl-import kan fortrydes samlet. Hver post importen oprettede, får
 * `importId` sat til dette dokuments id, så "slet denne import" kan finde præcis dem —
 * og kun dem.
 */
export type CvImport = {
  /** Hvor mange poster der faktisk blev oprettet. */
  antal: number;
  /** Kollektionsnavn → antal, til listen. */
  fordeling: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

// ---- Indstillings-dokumentet ------------------------------------------------

/**
 * Designet ligger i data, ikke i koden.
 *
 * `grundstoerrelse` og `luft` er de to skruer man kalibrerer på når skrifterne skiftes —
 * derfor skal de kunne ændres uden en ny udgivelse.
 */
export type CvStil = {
  grundstoerrelse: number;
  linjeafstand: number;
  /** Ganges KUN på lodrette mellemrum, aldrig på skriftstørrelser. */
  luft: number;
};

/**
 * Et link har både en adresse og en tekst.
 *
 * De er sjældent ens: man skriver "hgrunberg.dk" men linker til "https://hgrunberg.dk".
 * PDF'en får et rigtigt `<a href>`, så modtageren kan klikke — en CV-PDF læses lige så
 * ofte på skærm som på papir.
 */
export type CvLink = { tekst: string; url: string };

/**
 * Ældre kataloger gemte links som rene strenge. De læses stadig: teksten bliver adressen,
 * og adressen får `https://` foran hvis den mangler.
 */
export function normalizeLink(raw: unknown): CvLink | null {
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t ? { tekst: t, url: /^https?:\/\//i.test(t) ? t : `https://${t}` } : null;
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const tekst = typeof o.tekst === 'string' ? o.tekst.trim() : '';
    const url = typeof o.url === 'string' ? o.url.trim() : '';
    /**
     * Ingen adresse, intet link. Teksten må IKKE falde tilbage til at være adressen her —
     * det gav `https://Min blog` for en halvt udfyldt række. Fallbacken hører kun til
     * streng-formatet ovenfor, hvor strengen ER adressen. Rækker uden adresse fanges i
     * `validateValues`, så man får det at vide i stedet for at få et ødelagt link.
     */
    if (!url) return null;
    return {
      tekst: tekst || url,
      url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
    };
  }
  return null;
}

export type CvPerson = {
  navn: string;
  titel: CvText;
  email: string;
  telefon: string;
  by: string;
  /** Download-URL fra Storage. Inlines som data-URI før print. */
  foto?: string;
  links: CvLink[];
};

export type CvOm = {
  personlig: CvText;
  /** Kursiv slutlinje under OM MIG. */
  anerkendelse: CvText;
};

export type CvIndstillinger = {
  stil: CvStil;
  person: CvPerson;
  om: CvOm;
  updatedAt: string;
};

/**
 * Brandfarven står IKKE her. Den hører til den enkelte ansøgning — det er modtagerens
 * farve, ikke din — og sættes derfor pr. CV. Denne bruges kun når intet andet er valgt.
 */
export const DEFAULT_BRAND = '#1f4e79';

export const DEFAULT_STIL: CvStil = {
  grundstoerrelse: 10,
  linjeafstand: 1.55,
  luft: 0.95,
};

export const EMPTY_PERSON: CvPerson = {
  navn: '',
  titel: '',
  email: '',
  telefon: '',
  by: '',
  links: [],
};

export const EMPTY_OM: CvOm = { personlig: '', anerkendelse: '' };
