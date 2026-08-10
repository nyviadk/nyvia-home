import { AppText } from '@/components/ui/text';
import { copyText } from '@/lib/clipboard/copy-text';
import { Pressable, View } from '@/tw';

/**
 * Etiket + værdi; tryk kopierer værdien.
 *
 * Var før web-only, hvilket ramte det mest oplagte brug: udlejerens reg.nr. og kontonummer
 * på boligsiden, som man netop vil kopiere PÅ telefonen og over i sin bank-app.
 */
export function CopyableRow({ label, value }: { label: string; value: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => void copyText(value)} hitSlop={6}>
      <View className="flex-row items-baseline justify-between gap-3">
        <AppText variant="muted">{label}</AppText>
        <AppText variant="label" className="flex-1 text-right">
          {value}
        </AppText>
      </View>
    </Pressable>
  );
}
