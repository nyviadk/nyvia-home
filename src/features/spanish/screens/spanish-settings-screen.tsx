import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Segmented } from "@/components/ui/segmented";
import { AppText } from "@/components/ui/text";
import type { SpeechAccent } from "@/lib/speech/accent";
import { View } from "@/tw";
import { SpeakableText } from "../components/speakable-text";
import { SpeakButton } from "../components/speak-button";
import { VoiceStatus } from "../components/voice-status";
import { setAccent, useQuizStore } from "../data/quiz-store";
import { ACCENTS } from "../types";

/**
 * Prøve-sætningen er valgt så man FAKTISK kan høre forskel: hvert markeret ord har c foran
 * e/i eller et z, som Spanien udtaler /θ/ ("th") og Latinamerika /s/. Syv forekomster på
 * fire sekunder gør skiftet tydeligt.
 *
 * vosotros/ustedes ville IKKE virke her: oplæseren siger den tekst den får, så en
 * grammatisk forskel kan man ikke høre — kun en udtale-forskel.
 */
const SAMPLE = "Cinco cervezas y un zumo de naranja. ¿Cuánto cuesta? Once con cincuenta, gracias.";

/** Ordene hvor forskellen sidder — fremhæves, så man ved hvad man skal lytte efter. */
const LISTEN_FOR = ["cinco", "cervezas", "zumo", "once", "cincuenta", "gracias"];

export function SpanishSettingsScreen() {
  const accent = useQuizStore((s) => s.accent);

  return (
    <Screen>
      <AppText variant="title">Stemme</AppText>

      <View className="gap-2">
        <AppText variant="label">Accent</AppText>
        <Segmented<SpeechAccent>
          value={accent}
          options={ACCENTS}
          onChange={setAccent}
        />
        <AppText variant="muted">
          Spanien udtaler c (foran e/i) og z som “th” i engelsk think; latinamerikansk siger
          s. Valget gælder al oplæsning i Spansk-afsnittet.
        </AppText>
      </View>

      <Card className="gap-3">
        <AppText variant="label">Hør forskellen</AppText>
        <SpeakableText text={SAMPLE} className="text-lg leading-relaxed text-fg" />

        <View className="gap-1.5 rounded-xl bg-element p-3">
          <AppText variant="muted" className="text-xs uppercase">
            Lyt efter
          </AppText>
          <View className="flex-row flex-wrap gap-1.5">
            {LISTEN_FOR.map((word) => (
              <View key={word} className="rounded-full bg-card px-2.5 py-1">
                <AppText className="text-sm text-accent-spanish">{word}</AppText>
              </View>
            ))}
          </View>
          <AppText variant="muted" className="text-xs">
            Skift accent og afspil igen — “th” bliver til “s”.
          </AppText>
        </View>

        <View className="flex-row">
          <SpeakButton text={SAMPLE} label="🔊 Afspil" />
        </View>
      </Card>

      <VoiceStatus accent={accent} />
    </Screen>
  );
}
