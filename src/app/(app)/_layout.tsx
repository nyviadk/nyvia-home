import { Drawer } from 'expo-router/drawer';

/**
 * Native-skal: en Drawer (side-menu) i stedet for bund-faner. Android-bund-baren kan
 * højst have ~6 faner, og appen får flere features — en drawer skalerer ubegrænset og
 * matcher web-sidebaren. Åbnes via hamburger-ikonet (edge-swipe er slået fra).
 *
 * Header-strategi (statisk → glatte navigations-animationer):
 * - Forside + Indstillinger er blad-skærme uden understak → de får drawer-headeren
 *   med hamburger direkte.
 * - Feature-mapperne (homes, budget …) får INGEN drawer-header; deres hamburger sidder
 *   i feature-stakkens egen index-header (drawerListHeaderOptions), samme niveau som
 *   tilbage-knappen på undersider. Dermed aldrig dobbelt-header og ingen dynamisk toggling.
 */
const CARD = '#ffffff';
const FG = '#2a2a28';

export default function AppDrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        // Kun hamburger åbner draweren — ingen edge-swipe.
        swipeEnabled: false,
        drawerActiveTintColor: '#2f7d6b',
        drawerActiveBackgroundColor: '#eef2ee',
        drawerLabelStyle: { fontSize: 15 },
        // Lys, flad header (ingen skygge/glas) — kun hamburger, titlen står i selve skærmen.
        headerStyle: { backgroundColor: CARD },
        headerShadowVisible: false,
        headerTintColor: FG,
        headerTitle: '',
      }}>
      <Drawer.Screen name="index" options={{ drawerLabel: 'Forside', headerShown: true }} />
      <Drawer.Screen
        name="settings"
        options={{ drawerLabel: 'Indstillinger', headerShown: true }}
      />
      <Drawer.Screen name="homes" options={{ drawerLabel: 'Hjem' }} />
      <Drawer.Screen name="budget" options={{ drawerLabel: 'Budget' }} />
      <Drawer.Screen name="spending" options={{ drawerLabel: 'Forbrug' }} />
      <Drawer.Screen name="loans" options={{ drawerLabel: 'Lån' }} />
      <Drawer.Screen name="subscriptions" options={{ drawerLabel: 'Abonnementer' }} />
      <Drawer.Screen name="timetracker" options={{ drawerLabel: 'Timetracker' }} />
    </Drawer>
  );
}
