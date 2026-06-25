import type { TextProps } from 'react-native';

import { cn } from '@/lib/cn';
import { Text } from '@/tw';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'muted';

const variantClass: Record<Variant, string> = {
  title: 'text-3xl font-bold text-fg',
  heading: 'text-xl font-semibold text-fg',
  body: 'text-base text-fg',
  label: 'text-sm font-medium text-fg',
  muted: 'text-sm text-fg-muted',
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
}

/** Typografi-komponent med semantiske farver (light/dark via CSS-variabler). */
export function AppText({ variant = 'body', className, ...props }: AppTextProps) {
  return <Text className={cn(variantClass[variant], className)} {...props} />;
}
