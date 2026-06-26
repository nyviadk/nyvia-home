import { Stack } from 'expo-router';

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
