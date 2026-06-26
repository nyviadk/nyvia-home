import type { TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { TextInput } from '@/tw';

export interface InputProps extends TextInputProps {
  invalid?: boolean;
}

/** Styled tekstfelt. */
export function Input({ invalid, className, style, ...props }: InputProps) {
  return (
    <TextInput
      placeholderTextColor="#a8a29a"
      style={[{ borderCurve: 'continuous' }, style]}
      className={cn(
        'h-12 rounded-xl border bg-card px-4 text-base text-fg',
        invalid ? 'border-danger' : 'border-border',
        className
      )}
      {...props}
    />
  );
}
