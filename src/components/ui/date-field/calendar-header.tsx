import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';

/** Frem/tilbage-pile om en periode-etiket. Deles af dag- og måneds-gitteret. */
export function CalendarHeader({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable accessibilityRole="button" onPress={onPrev} hitSlop={8} className="px-2 py-1">
        <AppText variant="heading">‹</AppText>
      </Pressable>
      <AppText variant="label" className="capitalize">
        {label}
      </AppText>
      <Pressable accessibilityRole="button" onPress={onNext} hitSlop={8} className="px-2 py-1">
        <AppText variant="heading">›</AppText>
      </Pressable>
    </View>
  );
}
