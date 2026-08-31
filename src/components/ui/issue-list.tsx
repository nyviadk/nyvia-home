import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { View } from '@/tw';

/** Én ting der er galt, med nok kontekst til at kunne rettes. */
export interface ProblemItem {
  /** Hvad problemet handler om — en linje, et id, en nøgle. */
  subject: string;
  reason: string;
  /** Hvad der ville have virket. Ved et ukendt valg: dem der findes. */
  options?: readonly string[];
}

/**
 * Liste over ting der ikke kunne bruges, med en årsag pr. styk.
 *
 * Årsagen pr. linje er hele pointen. Uden den står man med en tavs uoverensstemmelse
 * mellem hvad man indsatte og hvad der blev oprettet, og ingen måde at finde ud af hvad
 * der forsvandt. Optællingen i overskriften gør at man opdager det overhovedet.
 *
 * `warning` til ting der springes over men ikke blokerer; `danger` når noget ikke kan køre.
 */
export function IssueList({
  title,
  items,
  tone = 'danger',
}: {
  title: string;
  items: readonly ProblemItem[];
  tone?: 'danger' | 'warning';
}) {
  if (items.length === 0) return null;

  return (
    <View className="gap-1 border-t border-border pt-3">
      <AppText
        variant="label"
        className={cn('text-sm', tone === 'danger' ? 'text-danger' : 'text-warning')}>
        {items.length} {title}
      </AppText>
      {items.map((item, i) => (
        <View key={`${item.subject}:${i}`}>
          <AppText variant="muted" className="text-xs">
            “{item.subject}” — {item.reason}
          </AppText>
          {item.options?.length ? (
            <AppText variant="muted" className="text-xs opacity-70">
              findes: {item.options.join(', ')}
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}
