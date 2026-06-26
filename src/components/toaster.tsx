import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dismissToast, useToastStore } from '@/lib/toast/toast-store';
import { Pressable, Text, View } from '@/tw';

/** Global toast-overlay (bund, centreret). Monteres én gang i app-roden. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 16 }}
      className="items-center gap-2 px-4">
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(150)}
          style={{ width: '100%', maxWidth: 440 }}>
          <View
            style={{ boxShadow: '0 4px 14px rgba(40, 40, 38, 0.20)', borderCurve: 'continuous' }}
            className="flex-row items-center justify-between gap-3 rounded-xl bg-fg px-4 py-3">
            <Text className="flex-1 text-sm text-card">{toast.message}</Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}>
                <Text className="text-sm font-semibold text-primary">{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
