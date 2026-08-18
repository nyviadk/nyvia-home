import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhotoStrip } from '@/components/ui/photo-strip';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { stableHashHex } from '@/lib/hash';
import { Text, View } from '@/tw';
import { diffAnswer, type DiffPart } from '../answer-diff';
import { useQuizStore } from '../data/quiz-store';
import { isSpanishText, type QuizDirection, type SpanishEntry } from '../types';
import { PronText } from './pron-text';
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

/**
 * Parenteser i facit betyder "valgfrit". `(Yo) Quiero` godkender *quiero*, *yo quiero* og
 * *(yo) quiero* — spansk udelader som regel pronominet, så begge dele ER rigtige, og
 * parentesen er den naturlige måde at notere det på. Uden det her ville netop den notation
 * gøre det umuligt at svare rigtigt.
 */
const acceptedForms = (facit: string) => [
  facit, // skrevet af med parenteser og det hele
  facit.replace(/\([^)]*\)/g, ' '), // uden det valgfrie
  facit.replace(/[()]/g, ' '), // med det valgfrie, men uden parenteserne
];

const matches = (answer: string, facit: string) => {
  const given = normalize(answer);
  return acceptedForms(facit).some((form) => normalize(form) === given);
};

/**
 * Bogstaver — også de spanske og danske med tegn over. Bevidst en eksplicit liste frem for
 * `\p{L}`: Unicode-egenskaber i regex kræver ES2018-understøttelse, og det er ikke noget man
 * skal gætte om på tværs af Hermes og browsere for så simpel en ting.
 */
const LETTERS = /[a-záéíóúüñäöåæø]+/gi;

/**
 * Hintet: første bogstav i hvert ord, resten prikker.
 *
 * Det røber antal ord, længden af hvert og forbogstaverne — nok til at hukommelsen kan få
 * fat, men ikke nok til at man kan skrive svaret af. Tegnsætning bevares, for `¿` og
 * accenter er en del af det man skal huske.
 */
const maskFacit = (text: string) =>
  text.replace(LETTERS, (word) => word[0] + '·'.repeat(word.length - 1));

/**
 * Tekst hvor forskellene er farvet. Delene er indlejrede `<Text>` og ikke separate blokke,
 * så ordene stadig ombrydes som én sammenhængende sætning — et `flex-row`-layout ville
 * bryde linjen mellem hver eneste farvede stump.
 */
function DiffText({ parts, className }: { parts: DiffPart[]; className: string }) {
  return (
    <AppText className="text-xl leading-snug text-fg">
      {parts.map((part, i) => (
        <Text key={i} className={part.changed ? cn('font-bold', className) : undefined}>
          {part.text}
        </Text>
      ))}
    </AppText>
  );
}

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
  const [hinted, setHinted] = useState(false);

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

  /**
   * Kun ved et forkert, faktisk afgivet svar. Trykker man "Ved ikke", er der intet at
   * sammenligne — så ville hele facit stå markeret, hvilket ikke fortæller noget.
   */
  const diff = answered && !correct ? diffAnswer(answer.trim(), facit) : null;

  const reveal = () => setRevealed(true);

  /**
   * Et hint koster svaret. Fik man det rigtigt bagefter, tæller det stadig som fejl — kortet
   * kommer igen senere i runden, og det er hele pointen: kunne man det uden hjælp, havde man
   * ikke trykket. Alternativet, at give point for et hjulpet svar, ville gøre resultatet
   * ubrugeligt som mål for hvad man rent faktisk kan.
   */
  const next = () => onNext(isRule ? undefined : correct && !hinted ? 'correct' : 'wrong');

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
        {/* Udtalen står frit fremme når SPØRGSMÅLET er spansk: teksten er der jo allerede,
            så den røber ingenting — den hjælper bare med at læse den rigtigt højt. Er
            FACIT spansk, ligger den bag hint-knappen i stedet. */}
        {promptIsSpanish && entry.pron ? (
          <PronText pron={entry.pron} className="text-base" />
        ) : null}
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

      {isRule || revealed ? null : hinted ? (
        <View className="gap-1.5 rounded-xl bg-element p-3">
          <AppText variant="muted" className="text-xs uppercase">
            Hint
          </AppText>
          {/* Monospace: ellers er prikkerne smallere end bogstaverne, og ordlængden —
              halvdelen af hintet — bliver umulig at aflæse. */}
          <AppText className="text-xl leading-snug text-fg" style={{ fontFamily: 'monospace' }}>
            {maskFacit(facit)}
          </AppText>
          {facitIsSpanish && entry.pron ? (
            <PronText pron={entry.pron} className="text-base" />
          ) : null}
          <AppText variant="muted" className="text-xs">
            Tæller som fejl, også hvis du svarer rigtigt bagefter.
          </AppText>
        </View>
      ) : (
        <Button
          title="💡 Hint"
          variant="ghost"
          className="self-start"
          onPress={() => setHinted(true)}
        />
      )}

      {revealed ? (
        <View className="gap-3">
          {isRule ? null : (
            <AppText
              className={cn(
                'text-base font-semibold',
                !correct ? 'text-danger' : hinted ? 'text-warning' : 'text-success'
              )}>
              {!answered
                ? 'Ved ikke'
                : !correct
                  ? '✗ Forkert'
                  : hinted
                    ? '✓ Rigtigt — men med hint, så det tæller som fejl'
                    : '✓ Rigtigt'}
            </AppText>
          )}

          {diff ? (
            <View className="gap-1.5 rounded-xl bg-element p-3">
              <AppText variant="muted" className="text-xs uppercase">
                Dit svar
              </AppText>
              <DiffText parts={diff.answer} className="text-danger" />
            </View>
          ) : null}

          <View className="gap-1.5 rounded-xl bg-element p-3">
            <AppText variant="muted" className="text-xs uppercase">
              {isRule ? 'Forklaring' : 'Rigtigt svar'}
            </AppText>
            {/* Ved en fejl vinder markeringen over ord-for-ord-oplæsningen: man kan ikke
                både farve enkelte TEGN og gøre hvert ORD trykbart i samme tekst, og det
                man mangler at se lige dér er hvad der skulle have stået. Højttaler-knappen
                nedenfor læser stadig hele facit op.
                Regel-forklaringen er dansk, men ordene er trykbare, så de spanske
                eksempler i teksten kan høres enkeltvis. */}
            {diff ? (
              <DiffText parts={diff.facit} className="text-success" />
            ) : facitIsSpanish || isRule ? (
              <SpeakableText text={facit} className="text-xl leading-snug text-fg" />
            ) : (
              <AppText className="text-xl leading-snug text-fg">{facit}</AppText>
            )}
            {facitIsSpanish && entry.pron ? (
              <PronText pron={entry.pron} className="text-base" />
            ) : null}
            <View className="flex-row items-center gap-2">
              {facitIsSpanish ? <SpeakButton text={facit} label="🔊 Hør hele" /> : null}
              <AppText variant="muted" className="text-xs">
                {diff
                  ? 'Rødt = det du skrev galt · Grønt = det du manglede'
                  : facitIsSpanish
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
