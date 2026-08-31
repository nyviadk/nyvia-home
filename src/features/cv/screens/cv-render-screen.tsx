import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { copyText } from '@/lib/clipboard/copy-text';
import { CvOutput } from '../components/cv-output';
import { SelectionInput } from '../components/selection-input';
import { OverrideSection } from '../components/override-editor';
import { gemAnsoegning, gemRettelser, laesRettelser } from '../data/ansoegninger';
import { useCvDraft } from '../data/cv-draft';
import { useCvAnsoegninger, useCvSettings } from '../data/cv-stores';
import { useCvFrame } from '../hooks/use-cv-frame';
import { useStandardCv } from '../hooks/use-standard-cv';
import { countsOf, useCatalogue, useCatalogueLoading } from '../hooks/use-catalogue';
import { buildMenu } from '../menu/build-menu';
import { buildCvHtml } from '../render/build-cv-html';
import { resolveSelection, taelValgte, type CvOverrides } from '../render/render-doc';
import { parseSelection } from '../selection/selection';
import { validateSelection } from '../selection/validate-selection';
import { DEFAULT_BRAND } from '../types';

/** Samme regel som i `parseSelection`. Farven interpoleres ubehandlet ind i print-CSS'en. */
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Lav et CV: menu ud, selection ind, to sider ud.
 *
 * Web-only — det er ruten der vælger, ikke denne fil. Print-rammen er platform-splittet, så
 * DOM-koden findes ikke i native-bundtet.
 *
 * Alt afledes under render. Der er ingen `useEffect`: rammen oprettes af en ref-callback,
 * og der tegnes fra handlere. En effect ville betyde at et halvt indtastet JSON kunne nå at
 * udløse tre dokument-skrivninger mens man skriver.
 */

export function CvRenderScreen({ genaabn }: { genaabn?: string }) {
  const snapshot = useCatalogue();
  const stil = useCvSettings((s) => s.stil);
  const person = useCvSettings((s) => s.person);
  const om = useCvSettings((s) => s.om);
  const indstillingerLoading = useCvSettings((s) => s.loading);
  const katalogLoading = useCatalogueLoading();
  const standard = useStandardCv();
  const { item: gemt, loading: arkivLoading } = useCvAnsoegninger.useItem(genaabn);

  /**
   * Udkastet ligger i en persisteret store, ikke i lokal state.
   *
   * Man springer hele tiden ind i kataloget for at rette en tastefejl og tilbage igen — og
   * med `useState` var alt væk hver gang. Rettelser og valgt farve følger med af samme grund.
   */
  const draft = useCvDraft();
  // Print-rammen, målingen og auto-tilpasningen bor i sin egen hook — den kender ikke til
  // CV'ets indhold, den får en bygger `(k) => html` ind.
  const { hostRef, fit, tegn, glem, toem, print, tegnVedMount } = useCvFrame();
  const [busy, setBusy] = useState(false);

  /**
   * Vent på indstillingerne — og på arkivet, hvis vi er på vej til at genåbne noget.
   *
   * `stil` og `person.navn` går direkte ind i dokumentet, så et CV bygget før butikken var
   * hentet, ville blive målt og printet med standardstilen og uden navn — det ligner et
   * layout-problem, ikke en tom butik.
   *
   * Porten er også dét, der gør `udkast ?? gemt.selection` nedenfor forsvarlig: mønstret
   * fryser ved første tastetryk, og her kan der ikke tastes før butikken ER hentet.
   */
  if (indstillingerLoading || katalogLoading || standard.loading || (genaabn && arkivLoading)) {
    return <LoadingScreen />;
  }

  // Et tomt katalog giver en menu uden ID'er. Claude ville så finde på nogle selv, og
  // valideringen ville afvise hele svaret — uden at nogen kunne se hvorfor.
  const katalogTomt = Object.values(countsOf(snapshot)).every((n) => n === 0);

  // Genåbner man fra arkivet, vinder den gemte ansøgning over udkastet.
  const text = gemt?.selection ?? draft.text;
  const overrides = gemt ? laesRettelser(gemt.rettelser) : draft.rettelser;
  const ansoegningId = gemt?.id ?? draft.ansoegningId;

  const parsed = parseSelection(text);
  const sel = parsed.selection;
  const formfejl = parsed.issues;
  const katalogfejl = sel && !formfejl.length ? validateSelection(sel, snapshot) : [];
  const fejl = [...formfejl, ...katalogfejl];
  const klar = !!sel && fejl.length === 0 && text.trim() !== '';

  /**
   * Farven valgt i appen vinder over selectionens — den er valgt senere og med øjnene på.
   *
   * KUN hvis den er en gyldig hex. Feltet er fritekst, og halvskrevne `#0b5` går direkte ind
   * i print-CSS'ens `background:` mens man taster. `darkenForText` falder tilbage til sort,
   * så teksten ville stadig kunne læses — men båndet blev usynligt uden en forklaring.
   */
  const valgt = draft.brandfarve ?? '';
  const brand = HEX_RE.test(valgt) ? valgt : (sel?.brandfarve ?? DEFAULT_BRAND);
  // To opløsninger: én med rettelser (den der tegnes) og én uden (så editoren kan vise
  // hvad der er ændret, og komme tilbage til katalogets ord).
  const doc = klar ? resolveSelection(sel, snapshot, { person, om }, brand, overrides) : null;
  const basis = klar ? resolveSelection(sel, snapshot, { person, om }, brand) : null;

  const antal = doc ? taelValgte(doc) : { punkter: 0, kompetencer: 0, projekter: 0 };

  /**
   * Ny tekst = et nyt CV og en ny ansøgning.
   *
   * Nulstilles `fit` ikke, bliver "Print"-knappen stående og printer det FORRIGE dokument,
   * som stadig står i iframen. Og uden at glemme `egetId` ville den næste selection blive
   * gemt oven i den forrige ansøgning i arkivet.
   */
  const skiftTekst = (v: string) => {
    draft.saet({ text: v, ansoegningId: null, rettelser: {} });
    glem();
  };

  /**
   * Ryd ALT — ikke bare tekstfeltet.
   *
   * Tre ting blev stående før:
   * 1. Rammen: det forrige CV lyste videre i forhåndsvisningen, som om intet var sket.
   * 2. Rettelses-panelet: stod åbent med felter fra et dokument der ikke længere fandtes.
   * 3. Værst — er man kommet hertil fra arkivet, vinder `gemt?.selection` over udkastet
   *    (se `text` ovenfor). At tømme udkastet gjorde derfor INTET: teksten kom lige tilbage
   *    fra den gemte ansøgning. Derfor skal `?a=`-parameteren også af, og det gøres med
   *    `replace`, så man ikke lander på den gemte ansøgning igen ved at gå tilbage.
   */
  const ryd = () => {
    draft.ryd();
    toem();
    if (genaabn) router.replace('/cv/render');
  };

  const skabelon = () => skiftTekst(standard.tekst());

  const tegnMed = (o: CvOverrides = overrides) => {
    if (!sel || !klar) return Promise.resolve();
    const d = resolveSelection(sel, snapshot, { person, om }, brand, o);
    return tegn((k) => buildCvHtml(d, stil, k));
  };

  /**
   * Tegn med det samme når rammen er klar, hvis der ER noget at tegne.
   *
   * Det er dét, der gør "Åbn igen" i arkivet til en vej til en PDF: skærmen åbner, CV'et
   * står der, og print-knappen er lige ved siden af. Samme for et gemt udkast man kommer
   * tilbage til. Sættes ved hver render, men køres kun én gang — når iframen oprettes.
   */
  tegnVedMount(() => {
    if (klar) void tegnMed().catch(() => undefined);
  });

  const visCv = async () => {
    if (!sel || !klar) return;
    setBusy(true);
    try {
      // Gemmes i det øjeblik valideringen er gået igennem og man beder om at se den.
      // Objektet findes allerede, det er ét kald, og et CV man kiggede på tæller.
      if (!ansoegningId) draft.saet({ ansoegningId: await gemAnsoegning(sel, text) });
      await tegnMed();
    } catch {
      // Toasten er allerede vist af repository-laget.
    } finally {
      setBusy(false);
    }
  };

  /** Rettelser gemmes når feltet forlades — ikke ved hvert tastetryk. */
  const commitRettelser = () => {
    if (ansoegningId) void gemRettelser(ansoegningId, overrides).catch(() => undefined);
    // `catch` og ikke bare `void`: en fejlet gentegning ville ellers blive en ubehandlet
    // rejection midt i en blur-handler, hvor der ikke er nogen at vise den til.
    void tegnMed().catch(() => undefined);
  };

  /**
   * Menuen bygges under render, ikke inde i handleren.
   *
   * Så kan linjetallet vises på skærmen FØR man trykker. En knap der lægger noget på
   * udklipsholderen man ikke kan se, er en knap man ikke stoler på — og netop dér gemte den
   * fejl sig, hvor menuen var tom fordi kataloget ikke var hentet endnu.
   */
  const menu = buildMenu(snapshot, 'da');
  const kopierMenu = () =>
    void copyText(menu, 'Menuen er kopieret — indsæt den i Claude sammen med jobopslaget');

  /**
   * Nødudgangen: den samme HTML, men med en ABSOLUT adresse til skrifterne.
   *
   * Uden `<base>` peger `/fonts/…` på den mappe filen tilfældigvis blev gemt i, og der er
   * ingen skrifter. Så renderer den gemte fil i Georgia og Arial, ombryder anderledes end
   * forhåndsvisningen — og man tror layoutet er i stykker, når det i virkeligheden bare er
   * to forskellige skrifter. Derfor peger den tilbage på appen.
   */
  const kopierHtml = () => {
    if (!doc) return;
    const base = typeof location === 'undefined' ? undefined : `${location.origin}/`;
    void copyText(buildCvHtml(doc, stil, fit?.k ?? 1, base), 'HTML kopieret');
  };

  return (
    <Screen>
      <AppText variant="title">Lav et CV</AppText>

      <SelectionInput
        text={text}
        onChangeText={skiftTekst}
        fejl={fejl}
        antal={antal}
        sprog={sel?.sprog ?? null}
        klar={klar}
        onKopierMenu={kopierMenu}
        onSkabelon={skabelon}
        harEgenStandard={standard.harEgen}
        onGemSomStandard={klar ? () => standard.gem(text) : undefined}
        brandfarve={valgt || brand}
        onBrandfarve={(v) => draft.saet({ brandfarve: v })}
        onRyd={ryd}
        katalogTomt={katalogTomt}
        menuLinjer={menu.split('\n').length}
      />

      <Button
        title={ansoegningId ? 'Opdatér CV' : 'Vis CV og gem i arkiv'}
        className="h-12"
        disabled={!klar}
        loading={busy}
        onPress={() => void visCv()}
      />

      {doc && basis ? (
        <OverrideSection
          doc={doc}
          basis={basis}
          overrides={overrides}
          onChange={(next) => draft.saet({ rettelser: next })}
          onCommit={commitRettelser}
        />
      ) : null}

      <CvOutput
        fit={fit}
        antal={antal}
        hostRef={hostRef}
        onPrint={print}
        onKopierHtml={kopierHtml}
        harDokument={!!doc}
      />
    </Screen>
  );
}
