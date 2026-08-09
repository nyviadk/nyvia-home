import type { ReactNode } from 'react';

import { MoneyText } from '@/components/ui/money-text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/**
 * "Restgæld af oprindeligt beløb" + fremdriftslinje + en fod-linje.
 *
 * Lå tre steder: standard-lånekortet, flytte-lånekortet og lån-detaljen. De var
 * karakter-for-karakter ens bortset fra variabelnavnene, så en justering af layoutet
 * skulle laves tre gange for at kortene blev ved med at ligne hinanden.
 */
export function LoanProgressBlock({
  currentOre,
  originalOre,
  progress,
  footerLeft,
  footerRight,
}: {
  currentOre: number;
  originalOre: number;
  /** 0–1. */
  progress: number;
  footerLeft: string;
  footerRight: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between">
        <MoneyText ore={currentOre} whole variant="heading" />
        <View className="flex-row items-baseline gap-1">
          <AppText variant="muted">af</AppText>
          <MoneyText ore={originalOre} whole variant="muted" />
        </View>
      </View>
      <ProgressBar value={progress} />
      <View className="flex-row justify-between">
        <AppText variant="muted">{footerLeft}</AppText>
        {footerRight}
      </View>
    </View>
  );
}
