import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { Assessment } from '../balance';

/**
 * Dagens status i én sætning, og hvad man skal være obs på i den næste.
 *
 * Rådet er bevidst en BESKRIVELSE og ikke en liste af retter. En liste er kun rigtig så
 * længe kataloget står stille; en beskrivelse af hvad man skal lede efter holder også når
 * der er kommet halvtreds retter til, og lader én selv vælge hvad man har lyst til.
 */
export function BalanceCard({ assessment }: { assessment: Assessment }) {
  const { state, headline, advice } = assessment;
  const alarm = state === 'over-kcal';
  const good = state === 'i-maal';

  return (
    <Card
      className={cn(
        'gap-1.5 border-l-4',
        alarm ? 'border-l-danger' : good ? 'border-l-success' : 'border-l-accent-protein'
      )}>
      <AppText
        className={cn(
          'text-base font-semibold',
          alarm ? 'text-danger' : good ? 'text-success' : 'text-fg'
        )}>
        {headline}
      </AppText>
      {advice ? (
        <AppText variant="muted" className="leading-relaxed">
          {advice}
        </AppText>
      ) : null}
    </Card>
  );
}
