import type { CvSnapshot } from '../data/catalogue-io';
import { CV_COLL_KEYS, type CvCollKey } from '../data/cv-repos';
import { CV_STORES } from '../data/cv-stores';

/**
 * Hele kataloget som ét opslagsobjekt, id → dokument.
 *
 * `useAllItems()` og ikke `useVisibleItems()`: en post der ligger i et åbent fortryd-vindue
 * findes stadig i Firestore. Ved import ville den ellers blive rapporteret som "ny" og
 * støde sammen med sig selv, hvis man fortryder sletningen — og ved rendering ville et
 * punkt forsvinde ud af CV'et i tavshed. Jf. undtagelsen i AGENTS.md.
 *
 * Hookene kaldes ubetinget og i fast rækkefølge, så reglerne for hooks holder.
 */
export function useCatalogue(): CvSnapshot {
  const jobs = CV_STORES.jobs.useAllItems();
  const punkter = CV_STORES.punkter.useAllItems();
  const projekter = CV_STORES.projekter.useAllItems();
  const grupper = CV_STORES.grupper.useAllItems();
  const kompetencer = CV_STORES.kompetencer.useAllItems();
  const uddannelse = CV_STORES.uddannelse.useAllItems();
  const referencer = CV_STORES.referencer.useAllItems();
  const sprogfaerdigheder = CV_STORES.sprogfaerdigheder.useAllItems();

  const lists = {
    jobs,
    punkter,
    projekter,
    grupper,
    kompetencer,
    uddannelse,
    referencer,
    sprogfaerdigheder,
  };

  const out = {} as CvSnapshot;
  for (const key of CV_COLL_KEYS) {
    out[key] = Object.fromEntries(
      (lists[key] as readonly { id: string }[]).map((doc) => [doc.id, doc as Record<string, unknown>])
    );
  }
  return out;
}

/**
 * Er kataloget hentet endnu?
 *
 * `useCatalogue()` returnerer tomme opslag mens butikkerne henter, og en tom butik kan ikke
 * skelnes fra et tomt katalog. Uden dette signal kopierede "Kopiér menu" en menu HELT uden
 * poster — kun overskrifter og regler — og Claude ville så svare med ID'er den selv fandt på,
 * hvorefter valideringen afviste hele svaret. Man kunne se på teksten at der manglede noget,
 * men ikke hvorfor.
 *
 * Hookene kaldes ubetinget og i fast rækkefølge, som i `useCatalogue`.
 */
export function useCatalogueLoading(): boolean {
  const jobs = CV_STORES.jobs((s) => s.loading);
  const punkter = CV_STORES.punkter((s) => s.loading);
  const projekter = CV_STORES.projekter((s) => s.loading);
  const grupper = CV_STORES.grupper((s) => s.loading);
  const kompetencer = CV_STORES.kompetencer((s) => s.loading);
  const uddannelse = CV_STORES.uddannelse((s) => s.loading);
  const referencer = CV_STORES.referencer((s) => s.loading);
  const sprog = CV_STORES.sprogfaerdigheder((s) => s.loading);
  return (
    jobs || punkter || projekter || grupper || kompetencer || uddannelse || referencer || sprog
  );
}

/** Antal poster pr. kollektion, udregnet af et snapshot. */
export const countsOf = (snapshot: CvSnapshot): Record<CvCollKey, number> =>
  Object.fromEntries(CV_COLL_KEYS.map((k) => [k, Object.keys(snapshot[k]).length])) as Record<
    CvCollKey,
    number
  >;

/**
 * Tallene til hub-skærmen — talt på det man KAN SE.
 *
 * `useVisibleItems()` og ikke `useCatalogue()`: sletter man en post, ligger den i et åbent
 * fortryd-vindue nogle sekunder endnu, og `useAllItems()` tæller den stadig med. Tallet blev
 * altså stående mens rækken var væk fra listen, og det så ud som om sletningen ikke virkede.
 *
 * Selve kataloget skal derimod BLIVE ved at bruge `useAllItems()` — en post i fortryd-vinduet
 * findes stadig i Firestore, og et CV må ikke tabe et punkt fordi nogen er ved at fortryde.
 */
export function useCatalogueCounts(): Record<CvCollKey, number> {
  const jobs = CV_STORES.jobs.useVisibleItems();
  const punkter = CV_STORES.punkter.useVisibleItems();
  const projekter = CV_STORES.projekter.useVisibleItems();
  const grupper = CV_STORES.grupper.useVisibleItems();
  const kompetencer = CV_STORES.kompetencer.useVisibleItems();
  const uddannelse = CV_STORES.uddannelse.useVisibleItems();
  const referencer = CV_STORES.referencer.useVisibleItems();
  const sprogfaerdigheder = CV_STORES.sprogfaerdigheder.useVisibleItems();

  const lists: Record<CvCollKey, readonly unknown[]> = {
    jobs,
    punkter,
    projekter,
    grupper,
    kompetencer,
    uddannelse,
    referencer,
    sprogfaerdigheder,
  };
  return Object.fromEntries(CV_COLL_KEYS.map((k) => [k, lists[k].length])) as Record<
    CvCollKey,
    number
  >;
}
