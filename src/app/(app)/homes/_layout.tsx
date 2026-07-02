import { Stack } from 'expo-router';

import { drawerListHeaderOptions } from '@/components/nav/drawer-menu-button';

export const unstable_settings = {
  anchor: 'index',
};

export default function HomesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={drawerListHeaderOptions} />
      <Stack.Screen name="new" options={{ title: 'Ny bolig' }} />
      <Stack.Screen name="address-changes" options={{ title: 'Adresseændringer' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Bolig' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Redigér bolig' }} />
      <Stack.Screen name="[id]/tasks" options={{ title: 'Flytte-todo' }} />
      <Stack.Screen name="[id]/inspection/index" options={{ title: 'Indflytningssyn' }} />
      <Stack.Screen name="[id]/inspection/new" options={{ title: 'Ny syns-post' }} />
      <Stack.Screen name="[id]/inspection/[itemId]" options={{ title: 'Redigér syns-post' }} />
    </Stack>
  );
}
