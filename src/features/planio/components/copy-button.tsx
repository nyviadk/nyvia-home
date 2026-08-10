import { copyText } from '@/lib/clipboard/copy-text';
import { cn } from '@/lib/cn';
import { Pressable, Text } from '@/tw';

/**
 * Kopiér-knap (web). Scope-gaten sender `disabled` → så kopiér er umuligt uden scope.
 * Feedback via toast ("Kopieret") frem for lokal state.
 */
export function CopyButton({
  text,
  label = 'Kopiér prompt',
  disabled,
}: {
  text: string;
  label?: string;
  disabled?: boolean;
}) {
  const copy = () => {
    if (!disabled) void copyText(text);
  };
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={copy}
      style={{ borderCurve: 'continuous' }}
      className={cn(
        'flex-row items-center gap-1.5 self-start rounded-lg border px-3 py-1.5',
        disabled ? 'border-border opacity-50' : 'border-primary/40 hover:bg-element',
      )}>
      <Text className={cn('text-sm font-medium', disabled ? 'text-fg-muted' : 'text-primary')}>{label}</Text>
    </Pressable>
  );
}
