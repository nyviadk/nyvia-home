import { Stack } from 'expo-router';

// Forankrer stakken til listen, så et direkte hit på /loans/[id] (reload/deep link)
// altid har lån-listen under sig → tilbage-knap virker, og man kan nå oversigten.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function LoansLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Nyt lån' }} />
      <Stack.Screen name="standard" options={{ title: 'Standard lån' }} />
      <Stack.Screen name="custom" options={{ title: 'Flytte-lån' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Lån' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Redigér lån' }} />
    </Stack>
  );
}
