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
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
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
