import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import type { UvSnapshot } from '../types';
import { formatClockFromISO, formatHour } from '../uv.utils';

/**
 * Hvornår data blev hentet — og hvornår Open-Meteo udgiver næste måling.
 * Er næste slot allerede passeret, siges det direkte at der ligger friske data og venter.
 */
export function FreshnessLine({ snapshot }: { snapshot: UvSnapshot }) {
  const nextData = snapshot.currentT + (snapshot.intervalSec || 900);
  const stillFresh = Math.floor(Date.now() / 1000) < nextData;

  return (
    <View className="flex-row flex-wrap items-center gap-x-2">
      <AppText variant="label">Hentet {formatClockFromISO(snapshot.fetchedAt)}</AppText>
      <AppText variant="muted">·</AppText>
      <AppText variant="label" className={stillFresh ? 'text-primary' : 'text-accent-moving'}>
        {stillFresh ? `ny data kl. ${formatHour(nextData)}` : 'ny data klar — tryk Hent frisk'}
      </AppText>
    </View>
  );
}
