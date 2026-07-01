import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import { useWindowDimensions } from "react-native";

import { NavItem } from "@/components/nav/nav-item";
import { AppText } from "@/components/ui/text";
import { Pressable, View } from "@/tw";
import React from "react";

const ITEMS = [
  { name: "homes", href: "/homes", label: "Hjem", accent: "text-accent-moving" },
  {
    name: "budget",
    href: "/budget",
    label: "Budget",
    accent: "text-accent-budget",
  },
  {
    name: "spending",
    href: "/spending",
    label: "Forbrug",
    accent: "text-accent-spending",
  },
  { name: "loans", href: "/loans", label: "Lån", accent: "text-accent-loans" },
  {
    name: "subscriptions",
    href: "/subscriptions",
    label: "Abonnementer",
    accent: "text-primary",
  },
  {
    name: "timetracker",
    href: "/timetracker",
    label: "Timetracker",
    accent: "text-accent-time",
  },
  {
    name: "settings",
    href: "/settings",
    label: "Indstillinger",
    accent: "text-fg",
  },
] as const;

// Token-hex (TabList er en plain RN-View → className virker ikke; vi styler via style).
const BORDER = "#e8e3da";
const CARD = "#ffffff";

/**
 * Web-skal: venstre sidebar på desktop, bund-bar på smal skærm. Ingen glas.
 * TabList + TabSlot SKAL være direkte børn af <Tabs>; TabList styles via `style`
 * (ikke className), da den renderer en almindelig RN-View.
 */
export default function AppWebLayout() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const nav = (
    <TabList
      style={
        wide
          ? {
              flexDirection: "column",
              justifyContent: "flex-start",
              width: 240,
              gap: 4,
              padding: 12,
              borderRightWidth: 1,
              borderColor: BORDER,
              backgroundColor: CARD,
            }
          : {
              flexDirection: "row",
              justifyContent: "space-around",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderTopWidth: 1,
              borderColor: BORDER,
              backgroundColor: CARD,
            }
      }
    >
      {/* Logoet ER index-triggeren: definerer forsiden i navigatoren (så TabSlot kan
          rendere den) og navigerer dertil — uden et synligt "Forside"-punkt i listen.
          Skjules på smal skærm, hvor der ikke er plads til et logo i bund-baren. */}
      <TabTrigger name="index" href="/" asChild>
        <Pressable
          accessibilityRole="link"
          className="px-3 pb-2 pt-3 hover:opacity-80"
          style={wide ? undefined : { display: "none" }}>
          <AppText variant="heading" className="text-primary">
            NyviaHome
          </AppText>
        </Pressable>
      </TabTrigger>
      {ITEMS.map((item) => (
        <React.Fragment key={item.name}>
          {/* Hvis det er en bred skærm, og vi er nået til 'settings', indsæt en spacer */}
          {wide && item.name === "settings" && <View style={{ flex: 1 }} />}

          <TabTrigger name={item.name} href={item.href} asChild>
            <NavItem
              label={item.label}
              accent={item.accent}
              layout={wide ? "sidebar" : "bottom"}
            />
          </TabTrigger>
        </React.Fragment>
      ))}
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
