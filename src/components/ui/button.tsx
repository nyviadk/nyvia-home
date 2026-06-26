import type { PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { ActivityIndicator, Pressable, Text } from '@/tw';

type Variant = 'primary' | 'secondary' | 'ghost';

const containerClass: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'border border-border bg-card',
  ghost: 'bg-transparent',
};

const labelClass: Record<Variant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-fg',
  ghost: 'text-primary',
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

/** Primær handlingsknap. Pressable (ikke TouchableOpacity) jf. RN-skill. */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={
        typeof style === 'function'
          ? (state) => [{ borderCurve: 'continuous' as const }, style(state)]
          : [{ borderCurve: 'continuous' as const }, style]
      }
      className={cn(
        'h-12 flex-row items-center justify-center rounded-xl px-4',
        containerClass[variant],
        isDisabled && 'opacity-50',
        className
      )}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : undefined} />
      ) : (
        <Text className={cn('text-base font-semibold', labelClass[variant])}>{title}</Text>
      )}
    </Pressable>
  );
}
