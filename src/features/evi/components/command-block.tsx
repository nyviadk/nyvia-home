import { toastAfter } from '@/lib/toast/notify';
import { Pressable, Text, View } from '@/tw';

const isWeb = process.env.EXPO_OS === 'web';

/** Monospace kommando/URL med kopiér-knap (web). Teksten kan også markeres manuelt. */
export function CommandBlock({ command }: { command: string }) {
  const copy = () => {
    if (isWeb && typeof navigator !== 'undefined' && navigator.clipboard) {
      void toastAfter(navigator.clipboard.writeText(command), 'Kopieret');
    }
  };
  return (
    <View
      className="flex-row items-center gap-2 rounded-lg border border-border bg-element px-3 py-2"
      style={{ borderCurve: 'continuous' }}>
      <Text
        selectable
        style={{ fontFamily: 'monospace', minWidth: 0 }}
        className="flex-1 break-all text-sm text-fg">
        {command}
      </Text>
      {isWeb ? (
        <Pressable
          accessibilityRole="button"
          onPress={copy}
          hitSlop={6}
          className="rounded-md px-2 py-1 hover:bg-selected">
          <Text className="text-sm font-medium text-primary">Kopiér</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
