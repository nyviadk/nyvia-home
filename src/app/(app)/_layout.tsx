import { useEffect } from 'react';
import { Drawer, useDrawerStatus } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { setDrawerOpen } from '@/lib/nav/drawer-status-store';
import { Pressable, ScrollView, Text, View } from '@/tw';

/**
 * Native-skal: en Drawer (side-menu) i stedet for bund-faner. Android-bund-baren kan
 * højst have ~6 faner, og appen får flere features — en drawer skalerer ubegrænset og
 * matcher web-sidebaren. Åbnes via hamburger-ikonet (edge-swipe er slået fra).
 *
 * Custom indhold: alle punkter øverst, "Indstillinger" pinnet i BUNDEN af draweren.
 * Bygget uden @react-navigation/drawer-imports (blokeret i SDK 56) — vi bruger bare
 * drawerens state/navigation.
 */
const CARD = '#ffffff';
const FG = '#2a2a28';

const LABELS: Record<string, string> = {
  index: 'Forside',
  homes: 'Hjem',
  budget: 'Budget',
  spending: 'Forbrug',
  loans: 'Lån',
  subscriptions: 'Abonnementer',
  timetracker: 'Timetracker',
  evi: 'Evi',
  settings: 'Indstillinger',
};

type DrawerRoute = { key: string; name: string };
type DrawerContentProps = {
  state: { index: number; routes: readonly DrawerRoute[] };
  navigation: { navigate: (name: string) => void; closeDrawer: () => void };
};

function DrawerRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ borderCurve: 'continuous' }}
      className={cn(
        'will-change-pressable mx-3 my-0.5 rounded-lg px-4 py-3 hover:bg-element active:bg-selected',
        active && 'bg-element',
      )}>
      <Text className={cn('text-base', active ? 'font-semibold text-primary' : 'text-fg')}>
        {label}
      </Text>
    </Pressable>
  );
}

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
  const top = state.routes.filter((r) => r.name !== 'settings');
  const hasSettings = state.routes.some((r) => r.name === 'settings');

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      <DrawerStatusBridge />
      <ScrollView className="flex-1" contentContainerClassName="py-2">
        {top.map((r) => (
          <DrawerRow
            key={r.key}
            label={LABELS[r.name] ?? r.name}
            active={r.name === activeName}
            onPress={() => go(r.name)}
          />
        ))}
      </ScrollView>
      {hasSettings ? (
        <View className="border-t border-border pt-1" style={{ paddingBottom: insets.bottom + 4 }}>
          <DrawerRow
            label={LABELS.settings}
            active={activeName === 'settings'}
            onPress={() => go('settings')}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function AppDrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContent state={props.state} navigation={props.navigation as DrawerContentProps['navigation']} />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: false,
        headerStyle: { backgroundColor: CARD },
        headerShadowVisible: false,
        headerTintColor: FG,
        headerTitle: '',
      }}>
      <Drawer.Screen name="index" options={{ headerShown: true }} />
      <Drawer.Screen name="settings" options={{ headerShown: true }} />
      <Drawer.Screen name="homes" />
      <Drawer.Screen name="budget" />
      <Drawer.Screen name="spending" />
      <Drawer.Screen name="loans" />
      <Drawer.Screen name="subscriptions" />
      <Drawer.Screen name="timetracker" />
      <Drawer.Screen name="evi" />
    </Drawer>
  );
}
