import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDrawerStatusStore } from "@/lib/nav/drawer-status-store";
import { dismissToast, useToastStore } from "@/lib/toast/toast-store";
import { Pressable, Text, View } from "@/tw";

/** Global toast-overlay (top-højre på web, top på mobil). Monteres én gang i app-roden. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  // Containeren er ikke længere fuldbredde, så toasten skal selv holde sig inden for skærmen.
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(440, width - insets.left - insets.right - 32);
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
      // Som PROP, ikke i `style`: style-varianten slår ikke pålideligt igennem her (css-wrapperen),
      // og så opfangede den usynlige fuldbredde-container alle klik i sin egen linje.
      pointerEvents="box-none"
      style={{
        position: "absolute",
        // KUN `right` — ingen `left`. Med begge sat blev containeren fuldbredde, og selv en kort
        // toast lå så i en usynlig boks tværs over skærmen der opfangede klik i sin egen linje.
        // Uden `left` kollapser boksen til indholdets bredde (toasten selv har en maks-bredde),
        // så der simpelthen ikke er noget at ramme ved siden af — uafhængigt af pointerEvents.
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
          // ligger i højre side; box-none (som prop) lader tryk gå igennem alt andet end boblen.
          pointerEvents="box-none"
          style={{ maxWidth, alignSelf: "flex-end" }}
        >
          <View
            style={{
              boxShadow: "0 4px 14px rgba(40, 40, 38, 0.20)",
              borderCurve: "continuous",
              // En toast er ikke tekst man skal markere — uden dette blev den bare "valgt"
              // når man forsøgte at klikke på noget bagved.
              userSelect: "none",
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
