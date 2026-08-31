import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable } from '@/tw';

/**
 * Mikroknap til ↑ / ↓ / ✕ i en tæt række.
 *
 * Lå privat i `field-editor.tsx`; udtrukket ved anden brug (CV-katalogets rækkefølge).
 * `disabled` er en tydelig tilstand og ikke bare et dødt tryk — man skal kunne se at man
 * er i toppen af listen uden at prøve.
 */
export function TinyButton({
  label,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      className={cn(
        'h-6 w-6 items-center justify-center rounded border border-border',
        disabled ? 'opacity-30' : 'active:bg-element'
      )}>
      <AppText className="text-xs leading-none text-fg-muted">{label}</AppText>
    </Pressable>
  );
}
