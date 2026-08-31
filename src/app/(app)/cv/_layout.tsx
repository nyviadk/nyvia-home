import { Stack } from 'expo-router';

import { drawerListHeaderOptions } from '@/components/nav/drawer-menu-button';

export const unstable_settings = {
  anchor: 'index',
};

export default function CvLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={drawerListHeaderOptions} />
      <Stack.Screen name="render" options={{ title: 'Lav et CV' }} />
      <Stack.Screen name="arkiv" options={{ title: 'Gemte ansøgninger' }} />
      <Stack.Screen name="io" options={{ title: 'Import og eksport' }} />
      <Stack.Screen name="settings" options={{ title: 'Stil og person' }} />
      <Stack.Screen name="[coll]/index" options={{ title: 'Katalog' }} />
      <Stack.Screen name="[coll]/new" options={{ title: 'Ny post' }} />
      <Stack.Screen name="[coll]/[id]" options={{ title: 'Redigér post' }} />
    </Stack>
  );
}
