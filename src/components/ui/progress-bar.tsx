import { cn } from '@/lib/cn';
import { View } from '@/tw';

export interface ProgressBarProps {
  /** Fremgang mellem 0 og 1. */
  value: number;
  className?: string;
}

/** Vandret fremgangs-bar (track + fyld). */
export function ProgressBar({ value, className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View className={cn('h-2 w-full overflow-hidden rounded-full bg-selected', className)}>
      <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}
