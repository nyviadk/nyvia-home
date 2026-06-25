import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { ScrollView, View } from '@/tw';

export interface ScreenProps {
  children: ReactNode;
  /** Slå scrolling fra (fx til skærme der selv håndterer en liste). */
  scroll?: boolean;
  className?: string;
}

/**
 * Standard skærm-wrapper: safe area + baggrund + maks-bredde på web.
 * Indhold scroller som standard (håndterer safe areas jf. RN-skill).
 */
export function Screen({ children, scroll = true, className }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const inner = (
    <View className={cn('w-full max-w-2xl flex-1 gap-4 self-center p-4', className)}>
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}
