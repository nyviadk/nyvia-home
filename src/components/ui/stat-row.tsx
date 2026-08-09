import type { ReactNode } from 'react';

import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/**
 * Dæmpet etiket til venstre, fremhævet værdi til højre. Kortenes arbejdshest —
 * lå som den samme lille `flex-row justify-between` med `variant="muted"` +
 * `variant="label"` spredt over lån, budget og forecast.
 *
 * `value` som children: nogle rækker viser tekst, andre en `<MoneyText/>`.
 */
export function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <AppText variant="muted">{label}</AppText>
      {typeof children === 'string' ? <AppText variant="label">{children}</AppText> : children}
    </View>
  );
}
