import BigNumber from 'bignumber.js';

import { cn } from '@/lib/cn';
import { View } from '@/tw';

export interface ProgressBarProps {
  /** Fremgang mellem 0 og 1. */
  value: number;
  className?: string;
}

/** Vandret fremgangs-bar (track + fyld). */
export function ProgressBar({ value, className }: ProgressBarProps) {
  const pct = BigNumber.minimum(1, BigNumber.maximum(0, value))
    .times(100)
    .integerValue(BigNumber.ROUND_HALF_UP)
    .toNumber();
  return (
    <View className={cn('h-2 w-full overflow-hidden rounded-full bg-selected', className)}>
      <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}
