import type { PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { Pressable, Text } from '@/tw';

export interface NavItemProps extends PressableProps {
  label: string;
  /** Sættes af TabTrigger (asChild) — aktiv fane. */
  isFocused?: boolean;
  /** Tailwind tekst-farveklasse til aktiv tilstand (feature-accent). */
  accent: string;
  layout: 'sidebar' | 'bottom';
}

/** Navigations-element til web-skallen (sidebar eller bund-bar). */
export function NavItem({ label, isFocused, accent, layout, ...props }: NavItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={{ borderCurve: 'continuous' }}
      className={cn(
        layout === 'sidebar'
          ? 'w-full flex-row items-center rounded-xl px-3 py-2.5'
          : 'flex-1 items-center rounded-lg py-2',
        isFocused && layout === 'sidebar' && 'bg-element'
      )}
      {...props}>
      <Text
        className={cn('text-sm', isFocused ? cn('font-semibold', accent) : 'text-fg-muted')}>
        {label}
      </Text>
    </Pressable>
  );
}
