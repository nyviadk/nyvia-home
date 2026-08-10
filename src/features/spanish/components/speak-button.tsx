import { AppText } from '@/components/ui/text';
import { speak } from '@/lib/speech/speak';
import { useResolvedVoice } from '@/lib/speech/voice-store';
import { Pressable } from '@/tw';
import { useQuizStore } from '../data/quiz-store';

/**
 * Læser en spansk tekst højt med den valgte accent.
 *
 * Accenten kommer fra quiz-storen, så den er den samme overalt i featuren. Den konkrete
 * stemme slås op og sendes MED — ellers kunne platformen vælge en anden end den, der står
 * på stemme-skærmen.
 */
export function SpeakButton({ text, label = '🔊' }: { text: string; label?: string }) {
  const accent = useQuizStore((s) => s.accent);
  const voice = useResolvedVoice(accent);
  if (!text.trim()) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hør udtale"
      hitSlop={8}
      onPress={() => speak(text, accent, voice?.id)}
      className="rounded-full bg-element px-3 py-1.5">
      <AppText className="text-base">{label}</AppText>
    </Pressable>
  );
}
