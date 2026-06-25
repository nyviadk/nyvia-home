import { formatDKK, formatDKKWhole } from '@/lib/money';
import { AppText, type AppTextProps } from './text';

export interface MoneyTextProps extends AppTextProps {
  /** Beløb i øre (heltal). */
  ore: number;
  /** Skjul ører (fx 42.000 kr. i stedet for 42.000,00 kr.). */
  whole?: boolean;
}

/** Viser et beløb (øre) formateret som dansk valuta. */
export function MoneyText({ ore, whole = false, ...props }: MoneyTextProps) {
  return <AppText {...props}>{whole ? formatDKKWhole(ore) : formatDKK(ore)}</AppText>;
}
