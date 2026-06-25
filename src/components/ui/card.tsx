import type { ViewProps } from 'react-native';

import { cn } from '@/lib/cn';
import { View } from '@/tw';

/** Generisk kort-flade (bg-element, afrundet, padding). */
export function Card({ className, ...props }: ViewProps) {
  return <View className={cn('rounded-2xl bg-element p-4', className)} {...props} />;
}
