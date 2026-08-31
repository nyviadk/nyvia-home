import type { FitMaal } from './fit';

/**
 * Den iframe der både ER forhåndsvisningen og dét der printes.
 *
 * ÉN ramme, ikke to. Byggede vi en ny iframe pr. print, kunne det printede og det viste
 * divergere uden at nogen opdagede det — og så er forhåndsvisningen værre end ingen.
 *
 * Afvigelser fra `inspection.export.ts`, som gør det samme uden måling:
 * - Dens iframe er 0×0. Et 0×0-dokument har ingen layout, så `scrollHeight` er meningsløs.
 *   Vores er lagt ud i præcis A4-bredde. Skjules aldrig med `display:none` — det fjerner
 *   layoutet fuldstændig.
 * - Den bygger og smider rammen væk pr. print. Vores lever så længe skærmen gør.
 */
export interface CvFrame {
  /** Skriv et nyt dokument og vent til skrifter og billeder er på plads. */
  write(html: string): Promise<void>;
  /** Mål de to sider. Skal kaldes EFTER `write` har resolvet. */
  measure(): FitMaal;
  /** Åbn browserens printdialog med iframens dokument — ikke app-siden. */
  print(): void;
  /** Vis det klippede overløb på skærmen, så man kan SE hvad der er for meget. */
  visOverloeb(paa: boolean): void;
  /** Tøm rammen. Uden den bliver det forrige CV stående efter et tryk på Ryd. */
  tom(): void;
  destroy(): void;
}

/** Hvor mange mm slæk vi holder. Skærmens layout og printerens er ikke samme kørsel. */
const SLAEK_MM = 2;

/** `document.fonts.ready` kan hænge. Så hellere måle lidt for tidligt end aldrig. */
const BACKSTOP_MS = 3000;

const vent = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createCvFrame(host: HTMLElement): CvFrame {
  const el = host.ownerDocument.createElement('iframe');
  el.setAttribute('title', 'CV');
  el.setAttribute('aria-label', 'Forhåndsvisning af CV');
  // Præcis A4-bredde. Højden er de to sider plus skærm-mellemrummet mellem dem
  // (`@media screen` i print-CSS'en); `#mm-probe` er absolut og fylder ikke.
  el.style.width = '210mm';
  el.style.height = '602mm';
  el.style.border = '0';
  el.style.display = 'block';
  el.style.background = '#fff';
  host.appendChild(el);

  const doc = () => el.contentDocument;

  const write = async (html: string): Promise<void> => {
    const d = doc();
    if (!d) return;
    d.open();
    d.write(html);
    d.close();

    /**
     * Vent på at layoutet HAR sat sig — ikke på en `setTimeout` der gætter.
     *
     * Skrifterne er fem rigtige downloads fra `/fonts/`. Måler man før de er hentet, måler
     * man i fallback-skriften, og resultatet er et `k` der ser rigtigt ud og printer tre
     * sider. `img.decode()` er med af samme grund: et billede uden højde måler som nul.
     */
    const klar = (async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const w = el.contentWindow as (Window & { document: Document }) | null;
      await (w?.document.fonts?.ready ?? Promise.resolve());
      await Promise.all(
        Array.from(d.images).map((img) => img.decode().catch(() => undefined))
      );
    })();

    await Promise.race([klar, vent(BACKSTOP_MS)]);
    // Ét frame mere, så den sidste ombrydning efter skriftskiftet er lagt ud før vi måler.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  };

  const measure = (): FitMaal => {
    const d = doc();
    const tom: FitMaal = { side1: 0, side2: 0, plads: 1, pxPerMm: 1 };
    if (!d) return tom;

    const probe = d.getElementById('mm-probe');
    const side = d.querySelector<HTMLElement>('.side');
    const inner1 = d.querySelector<HTMLElement>('.side1 > .inner');
    const inner2 = d.querySelector<HTMLElement>('.side2 > .inner');
    if (!probe || !side || !inner1 || !inner2) return tom;

    // Browserens egen målestok, målt i DETTE dokument. 297 mm er 1122,5 px ved 96 dpi —
    // hardkoder man tallet, bages afrundingsfejlen ind som en linje for meget.
    const pxPerMm = probe.getBoundingClientRect().height / 100 || 1;

    /**
     * ALLE fire mål tages med `getBoundingClientRect()`.
     *
     * Før blandede den `clientHeight` (heltal, ren layout) for siden med `getBoundingClientRect`
     * (brøkdele, som tegnet) for indholdet. To forskellige slags tal om det samme dokument:
     * afrundingen alene kunne give et par millimeter, og et par millimeter er præcis dét der
     * afgør om et CV "ikke passer".
     */
    const cs = (el.contentWindow as Window).getComputedStyle(side);
    const plads =
      side.getBoundingClientRect().height -
      parseFloat(cs.paddingTop) -
      parseFloat(cs.paddingBottom) -
      SLAEK_MM * pxPerMm;

    return {
      side1: inner1.getBoundingClientRect().height,
      side2: inner2.getBoundingClientRect().height,
      plads,
      pxPerMm,
    };
  };

  /**
   * Vis eller skjul overløbet på skærmen.
   *
   * `.side` klipper med `overflow:hidden`, så en side der er for lang, ser fuldstændig
   * rigtig ud i forhåndsvisningen — man får at vide at den er for lang og kan ikke få øje
   * på hvad der er for meget. Med klassen på spilder indholdet ud under en rød streg.
   */
  const visOverloeb = (paa: boolean) => {
    const d = doc();
    if (!d?.body) return;
    d.body.classList.toggle('for-lang', paa);
  };

  /**
   * Tøm dokumentet.
   *
   * Synkron og uden at vente på noget: der er intet at måle bagefter. Baggrunden sættes til
   * den samme grå som papiret ligger på, så en tømt ramme ser tom ud — ikke som et blankt
   * ark der venter på indhold.
   */
  const tom = () => {
    const d = doc();
    if (!d) return;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#8a8078"></body></html>');
    d.close();
  };

  const print = () => {
    const w = el.contentWindow;
    if (!w) return;
    w.focus();
    w.print();
  };

  return { write, measure, print, visOverloeb, tom, destroy: () => el.remove() };
}
