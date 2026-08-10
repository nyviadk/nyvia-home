import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { PhotoStrip } from '@/components/ui/photo-strip';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { isSpanishText, type SpanishEntry } from '../types';
import { SpeakableText } from './speakable-text';
import { SpeakButton } from './speak-button';

/**
 * Én post i listen.
 *
 * Arbejdsdeling på tryk: den DANSKE linje (og noten) åbner posten til redigering, mens den
 * SPANSKE linje læser ordet op. De to kan ikke ligge oven i hinanden — et tryk kan kun gøre
 * én ting — så den spanske linje er bevidst holdt uden for linket.
 *
 * For en REGEL er anden linje en dansk forklaring: ordene kan stadig trykkes (de spanske
 * eksempler sidder dér), men "hør hele"-knappen udelades — spansk stemme på dansk tekst.
 */
export function EntryRow({ entry }: { entry: WithId<SpanishEntry> }) {
  const speakable = isSpanishText(entry.kind);

  return (
    <Card className="gap-2">
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-0.5">
          <Link href={{ pathname: '/spansk/[id]', params: { id: entry.id } }} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Redigér ${entry.da}`}>
              <AppText variant="label">{entry.da}</AppText>
            </Pressable>
          </Link>
          <SpeakableText text={entry.es} variant="muted" />
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
