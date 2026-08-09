import type { PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { Pressable, Text } from '@/tw';

export interface NavItemProps extends PressableProps {
  label: string;
  /** Sættes af TabTrigger (asChild) på web — aktiv fane. */
  isFocused?: boolean;
  /** Tailwind tekst-farveklasse til aktiv tilstand (feature-accent). */
  accent: string;
  layout: 'sidebar' | 'bottom' | 'drawer';
}

const SHELL: Record<NavItemProps['layout'], string> = {
  sidebar: 'w-full flex-row items-center rounded-xl px-3 py-2.5',
  bottom: 'flex-1 items-center rounded-lg py-2',
  drawer: 'will-change-pressable mx-3 my-0.5 rounded-lg px-4 py-3 hover:bg-element active:bg-selected',
};

/** Navigations-element til begge skaller (web-sidebar/bund-bar og den native drawer). */
export function NavItem({ label, isFocused, accent, layout, ...props }: NavItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={{ borderCurve: 'continuous' }}
      className={cn(SHELL[layout], isFocused && layout !== 'bottom' && 'bg-element')}
      {...props}>
      <Text
        className={cn(
          layout === 'drawer' ? 'text-base' : 'text-sm',
          isFocused ? cn('font-semibold', accent) : layout === 'drawer' ? 'text-fg' : 'text-fg-muted'
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
