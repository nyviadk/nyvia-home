import { forwardRef } from 'react';
import type { TextInput as RNTextInput, TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { TextInput } from '@/tw';

export interface InputProps extends TextInputProps {
  invalid?: boolean;
}

/** Styled tekstfelt. Videresender ref til den underliggende TextInput (til fokus-styring). */
export const Input = forwardRef<RNTextInput, InputProps>(function Input(
  { invalid, className, style, ...props },
  ref
) {
  return (
    <TextInput
      ref={ref}
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
});
