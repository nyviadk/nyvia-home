import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Text } from '@/tw';
import { useQuizStore } from '../data/quiz-store';
import { pronForAccent } from '../pron';

/**
 * Udtalen, vist for den accent man rent faktisk har valgt.
 *
 * Etiketten sættes kun på de poster hvor de to accenter lyder forskelligt — dels så man
 * ved at netop dét ord skifter med indstillingen, dels så teksten ikke ser ud til at have
 * ændret sig af sig selv, næste gang man skifter stemme.
 */
export function PronText({ pron, className }: { pron: string; className?: string }) {
  const accent = useQuizStore((s) => s.accent);
  const { text, accentLabel } = pronForAccent(pron, accent);

  return (
    <AppText variant="muted" className={cn('italic', className)}>
      {text}
      {accentLabel ? <Text className="not-italic"> · {accentLabel}</Text> : null}
    </AppText>
  );
}
