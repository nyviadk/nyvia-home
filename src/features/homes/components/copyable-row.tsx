import { AppText } from '@/components/ui/text';
import { toastAfter } from '@/lib/toast/notify';
import { Pressable, View } from '@/tw';

const isWeb = process.env.EXPO_OS === 'web';

/** Label + værdi; tryk kopierer værdien (web). På native vises den blot. */
export function CopyableRow({ label, value }: { label: string; value: string }) {
  const copy = () => {
    if (isWeb && typeof navigator !== 'undefined' && navigator.clipboard) {
      void toastAfter(navigator.clipboard.writeText(value), 'Kopieret');
    }
  };
  return (
    <Pressable accessibilityRole={isWeb ? 'button' : 'text'} onPress={copy} hitSlop={6}>
      <View className="flex-row items-baseline justify-between gap-3">
        <AppText variant="muted">{label}</AppText>
        <AppText variant="label" className="flex-1 text-right">
          {value}
        </AppText>
      </View>
    </Pressable>
  );
}
