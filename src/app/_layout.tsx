import '@/global.css';

import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
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
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <RootNavigator />
        <Toaster />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
