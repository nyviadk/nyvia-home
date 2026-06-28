import { Stack } from "expo-router";

export const unstable_settings = {
  anchor: "index",
};

export default function SpendingLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[account]" options={{ title: "Konto" }} />
      <Stack.Screen name="transaction/[id]" options={{ title: "Postering" }} />
      <Stack.Screen name="import" options={{ title: "Importér bankdata" }} />
      <Stack.Screen name="import-batch/[id]" options={{ title: "Import" }} />
      <Stack.Screen name="settings" options={{ title: "Indstillinger" }} />
    </Stack>
  );
}
