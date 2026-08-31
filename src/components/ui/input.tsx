import { forwardRef } from 'react';
import type { TextInput as RNTextInput, TextInputProps, TextStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { TextInput } from '@/tw';

export interface InputProps extends TextInputProps {
  invalid?: boolean;
  /**
   * Lad feltet vokse med teksten i stedet for at rulle indeni. Kun sammen med `multiline`.
   *
   * På web klarer browseren det selv med `field-sizing: content` — feltet er præcis så højt
   * som indholdet, og man ser hele det man har skrevet uden at rulle i en lille kasse.
   * Behold en `min-h-*`-klasse som gulv, ellers klapper et tomt felt sammen til én linje.
   *
   * `fieldSizing` står ikke i RN's `TextStyle`, men react-native-web sender ukendte
   * style-nøgler videre til DOM'en. På native gør flaget ingenting.
   */
  autoGrow?: boolean;
}

const AUTO_GROW = { fieldSizing: 'content' } as unknown as TextStyle;

/** Styled tekstfelt. Videresender ref til den underliggende TextInput (til fokus-styring). */
export const Input = forwardRef<RNTextInput, InputProps>(function Input(
  { invalid, autoGrow, className, style, ...props },
  ref
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor="#a8a29a"
      style={[
        { borderCurve: 'continuous' },
        autoGrow && process.env.EXPO_OS === 'web' ? AUTO_GROW : null,
        style,
      ]}
      className={cn(
        'h-12 rounded-xl border bg-card px-4 text-base text-fg',
        invalid ? 'border-danger' : 'border-border',
        className
      )}
      {...props}
    />
  );
});
