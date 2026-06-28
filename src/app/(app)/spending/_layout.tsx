import { Stack, type Href } from 'expo-router';

import { headerBackTo } from '@/components/nav/header-back';

export const unstable_settings = {
  anchor: 'index',
};

// Ren tilbageknap kun på web (deep-link/reload har ingen historik → ankeret popper
// med ?id= i URL'en). På native bruges den normale back.
const isWeb = process.env.EXPO_OS === 'web';
const backTo = (fallback: Href) => (isWeb ? { headerLeft: headerBackTo(fallback) } : {});

export default function SpendingLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[account]" options={{ title: 'Konto', ...backTo('/spending') }} />
      <Stack.Screen name="transaction/[id]" options={{ title: 'Postering', ...backTo('/spending') }} />
      <Stack.Screen name="import" options={{ title: 'Importér bankdata' }} />
      <Stack.Screen
        name="import-batch/[id]"
        options={{ title: 'Import', ...backTo('/spending/import') }}
      />
      <Stack.Screen name="settings" options={{ title: 'Indstillinger' }} />
    </Stack>
  );
}
