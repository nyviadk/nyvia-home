import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhotoStrip } from '@/components/ui/photo-strip';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { stableHashHex } from '@/lib/hash';
import { View } from '@/tw';
import { useQuizStore } from '../data/quiz-store';
import { isSpanishText, type QuizDirection, type SpanishEntry } from '../types';
import { SpeakableText } from './speakable-text';
import { SpeakButton } from './speak-button';

/**
 * Retningen for ét kort ved 'blandet'.
 *
 * Hverken `Math.random()` eller et rent id-hash duer. Random under render ville vende kortet
 * hver gang man tastede et bogstav; et hash af id'et alene er stabilt for EVIGT, så hvert ord
 * lå fast i én retning runde efter runde — blandingen skete kun én gang, første gang ordet
 * blev oprettet. Rundens frø blandes derfor ind: konstant inde i runden, ny næste gang.
 */
function directionFor(
  entry: WithId<SpanishEntry>,
  direction: QuizDirection,
  seed: number
): 'da-es' | 'es-da' {
  if (direction !== 'mixed') return direction;
  return Number.parseInt(stableHashHex(`${entry.id}:${seed}`).slice(0, 2), 16) % 2 === 0
    ? 'da-es'
    : 'es-da';
}

/**
 * Er svaret rigtigt?
 *
 * Store/små bogstaver og dobbelte mellemrum ignoreres — det er tastefejl, ikke sprogfejl, og
 * en test der siger "forkert" til *Mañana* lærer dig kun at holde øje med shift-tasten.
 *
 * Accenter og tegn normaliseres derimod IKKE: *manana* er et andet ord end *mañana*, og
 * *si* betyder noget andet end *sí*. Netop dét er værd at blive rettet i.
 *
 * `toLowerCase` og ikke `toLocaleLowerCase`: sidstnævnte følger enhedens sprog, og på en
 * tyrkisk telefon bliver "I" til "ı" — så ville et rigtigt svar pludselig tælle som forkert.
 */
const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

const matches = (answer: string, facit: string) => normalize(answer) === normalize(facit);

/**
 * Ét kort i testen. Monteres med `key={entry.id}`, så svarfelt og facit-tilstand nulstilles
 * automatisk ved skift til næste kort — ingen effect til at rydde op.
 *
 * Regler har ikke ét svar man kan taste og scores derfor ikke: overskrift →
 * "Vis forklaring" → videre. Pointen med at skjule forklaringen er aktiv genkaldelse —
 * man svarer i hovedet først.
 */
export function QuizCard({
  entry,
  direction,
  onNext,
}: {
  entry: WithId<SpanishEntry>;
  direction: QuizDirection;
  onNext: (result?: 'correct' | 'wrong') => void;
}) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);

  const seed = useQuizStore((s) => s.seed);
  const isRule = entry.kind === 'regel';
  const dir = directionFor(entry, direction, seed);
  const prompt = isRule || dir === 'da-es' ? entry.da : entry.es;
  const facit = isRule || dir === 'da-es' ? entry.es : entry.da;
  /**
   * Hvad må læses op i sin helhed? Accenten er es-*, så dansk tekst ville lyde forkert.
   * En REGELS forklaring er dansk — den får ingen "hør hele"-knap, men ordene kan stadig
   * trykkes enkeltvis, så de spanske eksempler i teksten kan høres.
   */
  const hasSpanishSide = isSpanishText(entry.kind);
  const promptIsSpanish = hasSpanishSide && dir === 'es-da';
  const facitIsSpanish = hasSpanishSide && dir === 'da-es';

  const correct = matches(answer, facit);
  const answered = answer.trim().length > 0;

  const reveal = () => setRevealed(true);
  const next = () => onNext(isRule ? undefined : correct ? 'correct' : 'wrong');

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <AppText variant="muted" className="text-xs uppercase">
          {isRule ? 'Regel' : dir === 'da-es' ? 'Dansk → Spansk' : 'Spansk → Dansk'}
        </AppText>
        {promptIsSpanish ? (
          <SpeakableText text={prompt} className="text-2xl font-bold leading-snug text-fg" />
        ) : (
          <AppText className="text-2xl font-bold leading-snug text-fg">{prompt}</AppText>
        )}
        {promptIsSpanish ? (
          <View className="flex-row items-center gap-2 pt-1">
            <SpeakButton text={prompt} label="🔊 Hør hele" />
            <AppText variant="muted" className="text-xs">
              eller tryk på et enkelt ord
            </AppText>
          </View>
        ) : null}
      </View>

      {isRule ? null : (
        <Input
          value={answer}
          onChangeText={setAnswer}
          placeholder="Skriv svaret…"
          editable={!revealed}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={reveal}
        />
      )}

      {revealed ? (
        <View className="gap-3">
          {isRule ? null : (
            <AppText
              className={cn('text-base font-semibold', correct ? 'text-success' : 'text-danger')}>
              {!answered ? 'Ved ikke' : correct ? '✓ Rigtigt' : '✗ Forkert'}
            </AppText>
          )}

          <View className="gap-1.5 rounded-xl bg-element p-3">
            <AppText variant="muted" className="text-xs uppercase">
              {isRule ? 'Forklaring' : 'Rigtigt svar'}
            </AppText>
            {/* Regel-forklaringen er dansk, men ordene er trykbare, så de spanske
                eksempler i teksten kan høres enkeltvis. */}
            {facitIsSpanish || isRule ? (
              <SpeakableText text={facit} className="text-xl leading-snug text-fg" />
            ) : (
              <AppText className="text-xl leading-snug text-fg">{facit}</AppText>
            )}
            <View className="flex-row items-center gap-2">
              {facitIsSpanish ? <SpeakButton text={facit} label="🔊 Hør hele" /> : null}
              <AppText variant="muted" className="text-xs">
                {facitIsSpanish
                  ? 'eller tryk på et enkelt ord'
                  : isRule
                    ? 'Tryk på et spansk ord for at høre det'
                    : ''}
              </AppText>
            </View>
          </View>

          {entry.note ? <AppText variant="muted">{entry.note}</AppText> : null}
          <PhotoStrip urls={(entry.images ?? []).map((i) => i.url)} />

          <Button title="Næste" onPress={next} />
        </View>
      ) : (
        <View className="flex-row gap-3">
          {isRule ? (
            <View className="flex-1">
              <Button title="Vis forklaring" onPress={reveal} />
            </View>
          ) : (
            <>
              <View className="flex-1">
                <Button title="Ved ikke" variant="secondary" onPress={reveal} />
              </View>
              <View className="flex-1">
                <Button title="Tjek svar" onPress={reveal} disabled={!answered} />
              </View>
            </>
          )}
        </View>
      )}
    </Card>
  );
}
