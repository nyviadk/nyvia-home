import { cn } from '@/lib/cn';
import { Text, View } from '@/tw';
import type { TransactionKind } from '../types';

const STYLES: Record<TransactionKind, { label: string; box: string; text: string }> = {
  expense: { label: 'Udgift', box: 'bg-danger/10', text: 'text-danger' },
  income: { label: 'Indtægt', box: 'bg-accent-savings/15', text: 'text-accent-savings' },
  internal: { label: 'Intern', box: 'bg-element', text: 'text-fg-muted' },
};

/** Lille farve-mærkat for transaktionens klassifikation. */
export function KindBadge({ kind }: { kind: TransactionKind }) {
  const s = STYLES[kind];
  return (
    <View className={cn('rounded-full px-2 py-0.5', s.box)}>
      <Text className={cn('text-xs font-medium', s.text)}>{s.label}</Text>
    </View>
  );
}
