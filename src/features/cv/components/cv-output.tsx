import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';
import { fitBesked, type FitResultat } from '../render/fit';
import { PreviewFrame } from './preview-frame';

/** Hvor stor en del af indholdsboksen siden fylder. Kalibreringens måltal. */
const fyldning = (hoejde: number, plads: number) =>
  plads > 0 ? Math.round((hoejde / plads) * 100) : 0;

/** Px → mm, så tallene kan holdes op mod et stykke papir. */
const mm = (px: number, pxPerMm: number) => Math.round(px / (pxPerMm || 1));

/**
 * Hvad der kom ud: passer det, print-knappen, forhåndsvisningen og nødudgangen.
 *
 * Adskilt fra skærmen fordi den ellers voksede over 250 linjer — og fordi resultatet er en
 * anden slags ting end formularen ovenfor: her rettes intet, her ses der.
 */
export function CvOutput({
  fit,
  antal,
  hostRef,
  onPrint,
  onKopierHtml,
  harDokument,
}: {
  fit: FitResultat | null;
  antal: { punkter: number; kompetencer: number; projekter: number };
  hostRef: (el: HTMLDivElement | null) => void;
  onPrint: () => void;
  onKopierHtml: () => void;
  harDokument: boolean;
}) {
  return (
    <>
      {/* Passer det ikke, står 96 %-udgaven stadig i rammen nedenfor — man skal kunne SE
          hvad der er for meget, ikke bare få tallet. */}
      {fit && !fit.passer ? (
        <Card className="gap-1">
          {fitBesked(fit, antal)
            .split('\n')
            .map((linje, i) => (
              <AppText key={linje} className={i === 0 ? 'text-sm text-danger' : 'text-sm'}>
                {linje}
              </AppText>
            ))}
        </Card>
      ) : null}

      {/*
        Knappen står her så snart der ER tegnet noget — også når det ikke passer.
        Specifikationen siger "stop og sig at der skal skæres", ikke "spær for printet":
        det er mit CV, og vil jeg se den for lange udgave på papir, er det mit valg.
        Advarslen ovenfor bliver stående.
      */}
      {fit ? (
        <View className="gap-2">
          <Button
            title={fit.passer ? 'Print / gem som PDF' : 'Print alligevel (for langt)'}
            variant={fit.passer ? 'primary' : 'secondary'}
            className="h-12"
            onPress={onPrint}
          />
          <AppText variant="muted" className="text-xs leading-relaxed">
            Slå “Sidehoveder og sidefødder” FRA i printdialogen — den indstilling kan ikke
            styres fra CSS. Skala {Math.round(fit.k * 100)} %.
          </AppText>
        </View>
      ) : null}

      {/*
        Måletallene står ALTID, ikke kun når det passer. De er kalibreringens aflæsning — og
        når noget er "5 mm for langt", er det umuligt at forholde sig til uden at kunne se
        hvor meget der faktisk er plads til.
      */}
      {fit ? (
        <AppText variant="muted" className="text-xs leading-relaxed">
          Side 1 fylder {fyldning(fit.maal.side1, fit.maal.plads)} %, side 2{' '}
          {fyldning(fit.maal.side2, fit.maal.plads)} % — der er plads til{' '}
          {mm(fit.maal.plads, fit.maal.pxPerMm)} mm, og siderne fylder{' '}
          {mm(fit.maal.side1, fit.maal.pxPerMm)} / {mm(fit.maal.side2, fit.maal.pxPerMm)} mm.
          Justér grundstørrelsen under Stil og person hvis du vil have dem tættere på 100.
        </AppText>
      ) : null}

      <View className="gap-2 pt-2">
        <AppText variant="label">Forhåndsvisning</AppText>
        <PreviewFrame hostRef={hostRef} />
        {harDokument ? (
          <>
            <Pressable accessibilityRole="button" hitSlop={6} onPress={onKopierHtml}>
              <AppText className="text-sm font-semibold text-primary">
                Kopiér HTML — nødudgang hvis printet driller
              </AppText>
            </Pressable>
            <AppText variant="muted" className="text-xs leading-relaxed">
              Gem den i en .html-fil og åbn den i Chrome. Så kan layoutet fejlsøges uden
              print-rammen — og der er altid en vej til en PDF.
            </AppText>
          </>
        ) : null}
      </View>
    </>
  );
}
