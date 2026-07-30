import { Stack } from 'expo-router';

import { drawerListHeaderOptions } from '@/components/nav/drawer-menu-button';

export const unstable_settings = {
  anchor: 'index',
};

export default function OnskelisteLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={drawerListHeaderOptions} />
      <Stack.Screen name="new" options={{ title: 'Nyt ønske' }} />
      <Stack.Screen name="settings" options={{ title: 'Indstillinger' }} />
      <Stack.Screen name="[id]" options={{ title: 'Redigér ønske' }} />
    </Stack>
  );
}
