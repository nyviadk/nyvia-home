import { oreToInput, parseKronerInput } from '@/lib/money';
import { Input, type InputProps } from './input';

export interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
}

/**
 * Beløbsfelt med dansk formatering: skriv frit (komma for ører), og ved blur
 * normaliseres til "1.234,56" — tusind-separator tilføjes automatisk. Værdien er
 * en streng der parses med parseKronerInput (komma/punktum håndteres).
 */
export function MoneyInput({ value, onChangeText, onBlur, keyboardType, ...props }: MoneyInputProps) {
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType ?? 'decimal-pad'}
      onBlur={() => {
        const ore = parseKronerInput(value);
        if (ore !== null) onChangeText(oreToInput(ore));
        onBlur?.();
      }}
      {...props}
    />
  );
}
