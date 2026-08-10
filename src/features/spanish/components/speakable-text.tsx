import { AppText, type AppTextProps } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { speak } from '@/lib/speech/speak';
import { useResolvedVoice } from '@/lib/speech/voice-store';
import { Text } from '@/tw';
import { useQuizStore } from '../data/quiz-store';

/**
 * Deler teksten i ord, så hvert ord kan trykkes og læses op enkeltvis.
 *
 * Ordene er NESTEDE `<Text>` og ikke `<Pressable>`: en Pressable pr. ord ville bryde
 * tekstens ombrydning (hvert ord blev sin egen boks), mens nested Text flyder som
 * almindelig tekst og stadig tager imod tryk.
 */

/** Tegnsætning vises, men skal ikke med i oplæsningen — "¿Cómo?" udtales "Cómo". */
const LEADING = /^[¿¡"'«»(\[{]+/;
const TRAILING = /[?!.,;:…"'»)\]}]+$/;

function tokenize(text: string): { raw: string; spoken: string }[] {
  // Split der BEVARER mellemrummene, så teksten kan sættes sammen uændret.
  return text
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((raw) => ({ raw, spoken: raw.replace(LEADING, '').replace(TRAILING, '').trim() }));
}

export function SpeakableText({
  text,
  className,
  variant,
}: {
  text: string;
  className?: string;
  variant?: AppTextProps['variant'];
}) {
  const accent = useQuizStore((s) => s.accent);
  const voice = useResolvedVoice(accent);

  return (
    <AppText variant={variant} className={className}>
      {tokenize(text).map((token, i) =>
        token.spoken ? (
          <Text
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Udtal ${token.spoken}`}
            onPress={() => speak(token.spoken, accent, voice?.id)}
            // Ingen understregning som standard — hvert ord ville se ud som et link og gøre
            // teksten urolig. På web afslører hover at ordet kan trykkes.
            className={cn('hover:text-accent-spanish')}>
            {token.raw}
          </Text>
        ) : (
          token.raw
        )
      )}
    </AppText>
  );
}
