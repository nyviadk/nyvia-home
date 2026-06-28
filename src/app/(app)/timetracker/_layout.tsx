import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function TimetrackerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Ny registrering' }} />
      <Stack.Screen name="settings" options={{ title: 'Officiel projektstart' }} />
      <Stack.Screen name="[id]" options={{ title: 'Redigér registrering' }} />
    </Stack>
  );
}
