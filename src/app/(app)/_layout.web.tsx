import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import { useWindowDimensions } from "react-native";

import { NavItem } from "@/components/nav/nav-item";
import { AppText } from "@/components/ui/text";
import { FEATURE_NAV, HOME_ITEM, SETTINGS_ITEM } from "@/constants/features";
import { THEME_HEX } from "@/constants/theme";
import { Pressable, View } from "@/tw";

/**
 * Web-skal: venstre sidebar på desktop, bund-bar på smal skærm. Ingen glas.
 * TabList + TabSlot SKAL være direkte børn af <Tabs>; TabList styles via `style`
 * (ikke className), da den renderer en almindelig RN-View.
 *
 * Menuens indhold kommer fra `@/constants/features`, som den native drawer også bruger.
 */
const LIST_BASE = {
  gap: 4,
  borderColor: THEME_HEX.border,
  backgroundColor: THEME_HEX.card,
} as const;

const SIDEBAR = {
  ...LIST_BASE,
  flexDirection: "column",
  justifyContent: "flex-start",
  width: 240,
  padding: 12,
  borderRightWidth: 1,
} as const;

const BOTTOM_BAR = {
  ...LIST_BASE,
  flexDirection: "row",
  justifyContent: "space-around",
  paddingHorizontal: 8,
  paddingVertical: 6,
  borderTopWidth: 1,
} as const;

export default function AppWebLayout() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const layout = wide ? "sidebar" : "bottom";

  const nav = (
    <TabList style={wide ? SIDEBAR : BOTTOM_BAR}>
      {/* Logoet ER index-triggeren: definerer forsiden i navigatoren (så TabSlot kan
          rendere den) og navigerer dertil — uden et synligt "Forside"-punkt i listen.
          Skjules på smal skærm, hvor der ikke er plads til et logo i bund-baren. */}
      <TabTrigger name={HOME_ITEM.name} href={HOME_ITEM.href} asChild>
        <Pressable
          accessibilityRole="link"
          className="px-3 pb-2 pt-3 hover:opacity-80"
          style={wide ? undefined : { display: "none" }}>
          <AppText variant="heading" className="text-primary">
            NyviaHome
          </AppText>
        </Pressable>
      </TabTrigger>

      {FEATURE_NAV.map((item) => (
        <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
          <NavItem label={item.label} accent={item.accent} layout={layout} />
        </TabTrigger>
      ))}

      {/* Skubber Indstillinger ned i bunden af sidebaren; i bund-baren står den bare sidst. */}
      {wide ? <View style={{ flex: 1 }} /> : null}
      <TabTrigger name={SETTINGS_ITEM.name} href={SETTINGS_ITEM.href} asChild>
        <NavItem label={SETTINGS_ITEM.label} accent={SETTINGS_ITEM.accent} layout={layout} />
      </TabTrigger>
    </TabList>
  );

  // Ingen max-width her: scroll-container + Stack-header skal fylde hele bredden
  // (scrollbar i kanten). Bredde-begrænsning sker på selve indholdet (Screen/list).
  const content = (
    <View className="flex-1 bg-surface">
      <TabSlot />
    </View>
  );

  return (
    <Tabs style={{ flex: 1, flexDirection: wide ? "row" : "column" }}>
      {wide ? nav : null}
      {content}
      {wide ? null : nav}
    </Tabs>
  );
}
