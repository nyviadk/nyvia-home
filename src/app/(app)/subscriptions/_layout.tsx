import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function SubscriptionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Nyt abonnement' }} />
      <Stack.Screen name="[id]" options={{ title: 'Redigér abonnement' }} />
    </Stack>
  );
}
