import type { ViewProps } from 'react-native';

import { cn } from '@/lib/cn';
import { View } from '@/tw';

/** Generisk kort-flade: hvid, blød skygge, bløde hjørner (ingen glas). */
export function Card({ className, style, ...props }: ViewProps) {
  return (
    <View
      className={cn('rounded-2xl border border-border bg-card p-4', className)}
      style={[{ boxShadow: '0 1px 2px rgba(40, 40, 38, 0.05)', borderCurve: 'continuous' }, style]}
      {...props}
    />
  );
}
