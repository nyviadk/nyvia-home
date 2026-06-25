import type { TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { TextInput } from '@/tw';

export interface InputProps extends TextInputProps {
  invalid?: boolean;
}

/** Styled tekstfelt. */
export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <TextInput
      placeholderTextColor="#9ca3af"
      className={cn(
        'h-12 rounded-xl border bg-surface px-4 text-base text-fg',
        invalid ? 'border-red-500' : 'border-selected',
        className
      )}
      {...props}
    />
  );
}
