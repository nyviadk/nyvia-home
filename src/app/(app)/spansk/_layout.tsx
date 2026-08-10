import { Stack } from 'expo-router';

import { drawerListHeaderOptions } from '@/components/nav/drawer-menu-button';

export const unstable_settings = {
  anchor: 'index',
};

export default function SpanishLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={drawerListHeaderOptions} />
      <Stack.Screen name="new" options={{ title: 'Ny post' }} />
      <Stack.Screen name="test" options={{ title: 'Test' }} />
      <Stack.Screen name="settings" options={{ title: 'Stemme' }} />
      <Stack.Screen name="[id]" options={{ title: 'Redigér post' }} />
    </Stack>
  );
}
