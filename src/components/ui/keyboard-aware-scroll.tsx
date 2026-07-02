import type { ReactNode } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

/**
 * Native scroll-container: auto-scroller det fokuserede felt fri af tastaturet
 * (react-native-keyboard-controller — reanimated's useAnimatedKeyboard er deprecated).
 * bottomOffset giver lidt luft mellem felt og tastatur-toppen.
 */
export function KeyboardAwareScroll({ children }: { children: ReactNode }) {
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      bottomOffset={48}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
