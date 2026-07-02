import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";
import { View } from "@/tw";
import { KeyboardAwareScroll } from "@/components/ui/keyboard-aware-scroll";

export interface ScreenProps {
  children: ReactNode;
  /** Slå scrolling fra (fx til skærme der selv håndterer en liste). */
  scroll?: boolean;
  className?: string;
}

/**
 * Standard skærm-wrapper: safe area + baggrund + maks-bredde på web.
 * Indhold scroller som standard (håndterer safe areas jf. RN-skill).
 */
export function Screen({ children, scroll = true, className }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const inner = (
    <View
      className={cn("w-full max-w-225 flex-1 gap-4 self-center p-4", className)}
    >
      {children}
    </View>
  );

  return (
    // paddingTop bliver 0 på skærme med header (react-navigation "spiser" top-insettet);
    // paddingBottom holder indhold fri af Androids edge-to-edge nav-knapper.
    <View
      className="flex-1 bg-surface"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {scroll ? <KeyboardAwareScroll>{inner}</KeyboardAwareScroll> : inner}
    </View>
  );
}
