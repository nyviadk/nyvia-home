import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { PhotoStrip } from '@/components/ui/photo-strip';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { isSpanishText, sideLabels, type SpanishEntry } from '../types';
import { PronText } from './pron-text';
import { SpeakableText } from './speakable-text';
import { SpeakButton } from './speak-button';

/**
 * Én post i listen.
 *
 * Arbejdsdeling på tryk: den ØVERSTE linje (og noten) åbner posten til redigering, mens den
 * NEDERSTE læser teksten op. De to kan ikke ligge oven i hinanden — et tryk kan kun gøre én
 * ting — så den nederste linje er bevidst holdt uden for linket.
 *
 * For en REGEL er nederste linje en dansk forklaring: ordene kan stadig trykkes (de spanske
 * eksempler sidder dér), men "hør hele"-knappen udelades — spansk stemme på dansk tekst.
 */
export function EntryRow({ entry }: { entry: WithId<SpanishEntry> }) {
  const speakable = isSpanishText(entry.kind);
  const labels = sideLabels(entry.kind);

  /**
   * Regler får feltnavnene skrevet på — de SAMME ord som i formularen.
   *
   * Ved et ord eller en sætning kan man se på indholdet hvad der er hvad; ved en regel er
   * begge felter dansk prosa, og to linjer uden etiket er ikke til at skelne. Så var det
   * umuligt at kontrollere om man havde byttet rundt på dem, og lige så svært at vide hvad
   * man skulle skrive næste gang. Etiketterne står kun her, hvor de mangler.
   */
  const withLabels = entry.kind === 'regel';

  return (
    <Card className="gap-2">
      <View className="flex-row items-start gap-3">
        <View className={withLabels ? 'flex-1 gap-2' : 'flex-1 gap-0.5'}>
          <View className="gap-0.5">
            {withLabels ? (
              <AppText variant="muted" className="text-xs uppercase">
                {labels.da}
              </AppText>
            ) : null}
            <Link href={{ pathname: '/spansk/[id]', params: { id: entry.id } }} asChild>
              <Pressable accessibilityRole="button" accessibilityLabel={`Redigér ${entry.da}`}>
                <AppText variant="label">{entry.da}</AppText>
              </Pressable>
            </Link>
          </View>

          <View className="gap-0.5">
            {withLabels ? (
              <AppText variant="muted" className="text-xs uppercase">
                {labels.es}
              </AppText>
            ) : null}
            <SpeakableText text={entry.es} variant="muted" />
            {entry.pron ? <PronText pron={entry.pron} className="text-xs" /> : null}
          </View>

          {entry.note ? (
            <AppText variant="muted" className="text-xs">
              {entry.note}
            </AppText>
          ) : null}
        </View>
        {speakable ? <SpeakButton text={entry.es} /> : null}
      </View>
      <PhotoStrip urls={(entry.images ?? []).map((i) => i.url)} size={64} />
    </Card>
  );
}
