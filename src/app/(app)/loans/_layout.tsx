import { Stack } from 'expo-router';

import { drawerListHeaderOptions } from '@/components/nav/drawer-menu-button';

// Forankrer stakken til listen, så et direkte hit på /loans/[id] (reload/deep link)
// altid har lån-listen under sig → tilbage går til oversigten, ikke ud til en anden fane.
// (Hed `initialRouteName` før expo-router v4 — nu `anchor`.)
export const unstable_settings = {
  anchor: 'index',
};

export default function LoansLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={drawerListHeaderOptions} />
      <Stack.Screen name="new" options={{ title: 'Nyt lån' }} />
      <Stack.Screen name="standard" options={{ title: 'Standard lån' }} />
      <Stack.Screen name="custom" options={{ title: 'Flytte-lån' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Lån' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Redigér lån' }} />
    </Stack>
  );
}
