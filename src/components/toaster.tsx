import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDrawerStatusStore } from "@/lib/nav/drawer-status-store";
import { dismissToast, useToastStore } from "@/lib/toast/toast-store";
import { Pressable, Text, View } from "@/tw";

/** Global toast-overlay (top-højre på web, top på mobil). Monteres én gang i app-roden. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  // Toasteren males oven på hele navigatoren (søskende i app-roden), så en åben drawer ville
  // ellers få toasten liggende OVEN PÅ menuen. Skjul den mens draweren er åben — toasten
  // bliver hængende i køen og dukker op igen når menuen lukkes.
  const drawerOpen = useDrawerStatusStore((s) => s.open);

  if (toasts.length === 0 || drawerOpen) return null;

  // På native ligger app-headeren (med hamburger-ikonet) lige under statusbaren; en toast i
  // toppen dækkede den halvt, så hamburgeren var svær at ramme. Læg toasten UNDER headeren
  // (standard-headerhøjde ≈ 56). Web har ingen native header (sidebar) → ingen clearance.
  const headerClearance = process.env.EXPO_OS === "web" ? 0 : 56;

  return (
    <View
      style={{
        pointerEvents: "box-none",
        position: "absolute",
        // Både left OG right sættes → containeren får en reel bredde. Uden left kollapser
        // absolut-boksen til indholdsbredde på Android (Yoga), og child'ens width:100% blev
        // til en tynd lodret kasse uden plads til teksten. items-end = top-højre på web,
        // fuld bredde i toppen på smal mobil.
        left: insets.left + 16,
        right: insets.right + 16,
        top: insets.top + headerClearance + 16,
      }}
      className="items-end gap-2"
    >
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(150)}
          // Ingen width:100% — så fyldte hver toast hele bredden og opfangede tryk tværs over
          // skærmen, også hvor der ikke var noget at se. Den skrumper nu til sit indhold og
          // ligger i højre side (containerens items-end); box-none lader tryk gå igennem
          // alt andet end selve boblen.
          style={{ maxWidth: 440, alignSelf: "flex-end", pointerEvents: "box-none" }}
        >
          <View
            style={{
              boxShadow: "0 4px 14px rgba(40, 40, 38, 0.20)",
              borderCurve: "continuous",
            }}
            className="flex-row items-center justify-between gap-3 rounded-xl bg-fg px-4 py-3"
          >
            {/* `shrink` frem for `flex-1`: boblen sizes nu efter sit indhold, og flex-1 ville
                kollapse teksten til nul bredde i stedet for at fylde den plads der er. */}
            <Text className="shrink text-sm text-card">{toast.message}</Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
              >
                <Text className="text-sm font-semibold text-primary">
                  {toast.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
