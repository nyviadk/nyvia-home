import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import {
  pickVoice,
  regionLabel,
  type SpeechAccent,
  type SpeechVoiceInfo,
} from '@/lib/speech/accent';
import { useVoiceStore } from '@/lib/speech/voice-store';
import { View } from '@/tw';
import { ACCENTS } from '../types';

/**
 * Viser hvilken stemme hver accent FAKTISK ender på.
 *
 * Uden det her er der ingen måde at se, om enheden overhovedet HAR to spanske stemmer —
 * har den kun én, lyder begge valg ens, og det ligner en fejl i appen frem for en
 * manglende stemme i systemet.
 */

/**
 * Nogle TTS-motorer (især på Android) giver et tomt eller teknisk navn. Så er
 * identifikatoren stadig mere oplysende end ingenting — man skal aldrig stå med et blankt
 * felt og ikke vide hvad der spiller.
 */
const displayName = (voice: SpeechVoiceInfo) => voice.name?.trim() || voice.id || voice.lang;

const describe = (voice: SpeechVoiceInfo) => `${voice.lang} · ${regionLabel(voice.lang)}`;

function VoiceLine({
  label,
  voice,
  highlight,
}: {
  label: string;
  voice: SpeechVoiceInfo | undefined;
  highlight: boolean;
}) {
  return (
    <View className="gap-0.5">
      <AppText variant="muted" className="text-xs uppercase">
        {label}
      </AppText>
      {voice ? (
        <>
          {/* Ingen numberOfLines: lange systemnavne skal kunne læses, ikke klippes af. */}
          <AppText variant="label" className={cn(highlight && 'text-accent-spanish')}>
            {displayName(voice)}
          </AppText>
          <AppText variant="muted" className="text-xs">
            {describe(voice)}
          </AppText>
        </>
      ) : (
        <AppText variant="muted">Ingen</AppText>
      )}
    </View>
  );
}

export function VoiceStatus({ accent }: { accent: SpeechAccent }) {
  const voices = useVoiceStore((s) => s.voices);
  const loaded = useVoiceStore((s) => s.loaded);

  if (!loaded) {
    return (
      <Card>
        <AppText variant="muted">Finder stemmer på enheden…</AppText>
      </Card>
    );
  }

  if (voices.length === 0) {
    return (
      <Card className="gap-1">
        <AppText variant="label" className="text-danger">
          Ingen spansk stemme fundet
        </AppText>
        <AppText variant="muted">
          Enheden har ingen spansk tale installeret, så oplæsning virker ikke. På Android:
          Indstillinger → Tilgængelighed → Tekst-til-tale → installér spansk stemmedata.
        </AppText>
      </Card>
    );
  }

  const resolved = ACCENTS.map((a) => ({ ...a, voice: pickVoice(voices, a.value) }));
  const single = resolved[0].voice;
  // Samme stemme til begge valg = accent-skiftet kan ikke høres.
  const sameVoice = !!single && resolved.every((r) => r.voice?.id === single.id);

  return (
    <Card className="gap-3">
      <AppText variant="label">Stemme der bruges</AppText>

      {sameVoice ? (
        // Kun ÉN linje når stemmen er den samme — to identiske rækker ville se ud som om
        // der var to forskellige stemmer, hvilket er præcis den misforståelse vi vil undgå.
        <VoiceLine label="Begge accenter" voice={single} highlight />
      ) : (
        <View className="gap-3">
          {resolved.map((r) => (
            <VoiceLine
              key={r.value}
              label={r.label}
              voice={r.voice}
              highlight={r.value === accent}
            />
          ))}
        </View>
      )}

      {sameVoice ? (
        <View className="gap-1 rounded-xl bg-element p-3">
          <AppText variant="label" className="text-warning">
            Kun én spansk stemme på enheden
          </AppText>
          <AppText variant="muted" className="text-xs">
            Begge valg bruger “{single ? displayName(single) : ''}”, så du kan ikke høre
            forskel — det er ikke en fejl i appen. På Android installeres flere under
            Indstillinger → Tilgængelighed → Tekst-til-tale → Spansk. I Chrome på Windows
            følger de med de spanske sprogpakker.
          </AppText>
        </View>
      ) : null}

      <View className="gap-1 border-t border-border pt-2">
        <AppText variant="muted" className="text-xs uppercase">
          Fundet på enheden ({voices.length})
        </AppText>
        {voices.map((v) => (
          <AppText key={v.id} variant="muted" className="text-xs">
            {displayName(v)} — {describe(v)}
          </AppText>
        ))}
      </View>
    </Card>
  );
}
