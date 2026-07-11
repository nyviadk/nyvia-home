import { Stack } from 'expo-router';

import { drawerListHeaderOptions } from '@/components/nav/drawer-menu-button';

export const unstable_settings = {
  anchor: 'index',
};

export default function EviLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={drawerListHeaderOptions} />
      <Stack.Screen name="[id]" options={{ title: 'Kunde' }} />
      <Stack.Screen name="template" options={{ title: 'Skabelon' }} />
    </Stack>
  );
}
