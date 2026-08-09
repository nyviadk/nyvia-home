import { useEffect } from 'react';
import { Drawer, useDrawerStatus } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavItem } from '@/components/nav/nav-item';
import {
  FEATURE_NAV,
  HOME_ITEM,
  NATIVE_HIDDEN,
  navLabel,
  SETTINGS_ITEM,
} from '@/constants/features';
import { THEME_HEX } from '@/constants/theme';
import { setDrawerOpen } from '@/lib/nav/drawer-status-store';
import { ScrollView, View } from '@/tw';

/**
 * Native-skal: en Drawer (side-menu) i stedet for bund-faner. Android-bund-baren kan
 * højst have ~6 faner, og appen får flere features — en drawer skalerer ubegrænset og
 * matcher web-sidebaren. Åbnes via hamburger-ikonet (edge-swipe er slået fra).
 *
 * Custom indhold: alle punkter øverst, "Indstillinger" pinnet i BUNDEN af draweren.
 * Bygget uden @react-navigation/drawer-imports (blokeret i SDK 56) — vi bruger bare
 * drawerens state/navigation. Menuens indhold kommer fra `@/constants/features`,
 * som web-skallen også bruger.
 */
type DrawerRoute = { key: string; name: string };
type DrawerContentProps = {
  state: { index: number; routes: readonly DrawerRoute[] };
  navigation: { navigate: (name: string) => void; closeDrawer: () => void };
};

/**
 * Spejler drawerens status ind i en global store. Bevidst en (lille) effect: statussen er
 * EKSTERN state fra navigatoren, og Toasteren i app-roden ligger uden for drawer-konteksten
 * og kan derfor ikke læse den selv. Renderer intet.
 */
function DrawerStatusBridge() {
  const status = useDrawerStatus();
  useEffect(() => setDrawerOpen(status === 'open'), [status]);
  return null;
}

function DrawerContent({ state, navigation }: DrawerContentProps) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  const go = (name: string) => {
    navigation.navigate(name);
    navigation.closeDrawer();
  };

  // Filtrering sker HER og ikke ved at fjerne <Drawer.Screen>: expo-router registrerer ruter
  // ud fra filsystemet, så de ville stadig ligge i `state.routes` og dukke op i menuen.
  const top = state.routes.filter(
    (r) => r.name !== SETTINGS_ITEM.name && !NATIVE_HIDDEN.includes(r.name)
  );
  const hasSettings = state.routes.some((r) => r.name === SETTINGS_ITEM.name);

  const row = (name: string, key = name) => (
    <NavItem
      key={key}
      layout="drawer"
      label={navLabel(name)}
      isFocused={name === activeName}
      accent="text-primary"
      onPress={() => go(name)}
    />
  );

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      <DrawerStatusBridge />
      <ScrollView className="flex-1" contentContainerClassName="py-2">
        {top.map((r) => row(r.name, r.key))}
      </ScrollView>
      {hasSettings ? (
        <View className="border-t border-border pt-1" style={{ paddingBottom: insets.bottom + 4 }}>
          {row(SETTINGS_ITEM.name)}
        </View>
      ) : null}
    </View>
  );
}

export default function AppDrawerLayout() {
  return (
    <Drawer
      // 'history' → tilbageknappen går til den forrige skærm man var på (fx Budget → Lån →
      // tilbage = Budget), ikke til første rute. Standard er 'firstRoute', som sendte én helt
      // ud til Forsiden uanset hvor man kom fra.
      backBehavior="history"
      drawerContent={(props) => (
        <DrawerContent
          state={props.state}
          navigation={props.navigation as DrawerContentProps['navigation']}
        />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: false,
        headerStyle: { backgroundColor: THEME_HEX.card },
        headerShadowVisible: false,
        headerTintColor: THEME_HEX.fg,
        headerTitle: '',
      }}>
      {/* Forside og Indstillinger har en synlig header (de har ingen egen feature-stak). */}
      <Drawer.Screen name={HOME_ITEM.name} options={{ headerShown: true }} />
      <Drawer.Screen name={SETTINGS_ITEM.name} options={{ headerShown: true }} />
      {FEATURE_NAV.map((f) => (
        <Drawer.Screen key={f.name} name={f.name} />
      ))}
    </Drawer>
  );
}
