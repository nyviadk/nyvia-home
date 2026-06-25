import type { PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { ActivityIndicator, Pressable, Text } from '@/tw';

type Variant = 'primary' | 'secondary' | 'ghost';

const containerClass: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-selected',
  ghost: 'bg-transparent',
};

const labelClass: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-fg',
  ghost: 'text-primary',
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

/** Primær handlingsknap. Brug Pressable (ikke TouchableOpacity) jf. RN-skill. */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
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
