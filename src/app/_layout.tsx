import '@/global.css';

import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toaster } from '@/components/toaster';
import { useAuthStore } from '@/lib/auth/auth-store';
import { ActivityIndicator, View } from '@/tw';

function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }

  // Deklarativ guard: (app) mountes kun når der er en bruger, (auth) kun uden.
  // `w/[uid]` (delt ønskeliste) står bevidst UDEN FOR begge guards — gæster skal kunne åbne
  // linket uden login, og ejeren skal kunne åbne det uden at blive smidt ud i login-flowet.
  //
  // RÆKKEFØLGEN BETYDER NOGET: expo-router bruger JSX-rækkefølgen som skærm-rækkefølge, og
  // `Stack.Protected` filtrerer de spærrede skærme HELT ud. Peger URL'en på en filtreret skærm
  // (fx `/` → `(app)` når man er logget ud), falder react-navigation tilbage til den FØRSTE
  // skærm i listen. Lå `w/[uid]` først, blev det fallbacket — og da ruten er dynamisk uden
  // `uid` at indsætte, landede man på `/w/undefined`. Den skal derfor stå SIDST, så fallback
  // altid bliver (app) eller (auth).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="w/[uid]" />
    </Stack>
  );
}

export default function RootLayout() {
  // Light-only for nu → fast DefaultTheme (lyse nav-headers uanset system-tema).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider value={DefaultTheme}>
            {/* Light-only app → mørke status bar-ikoner/tekst (ellers usynlige på lys bund). */}
            <StatusBar style="dark" />
            <RootNavigator />
            <Toaster />
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
