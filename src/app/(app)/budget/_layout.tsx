import { Stack } from 'expo-router';

import { drawerListHeaderOptions } from '@/components/nav/drawer-menu-button';

// Forankrer stakken til listen (jf. loans/_layout) → deep link/reload på en post
// har altid budget-oversigten under sig.
export const unstable_settings = {
  anchor: 'index',
};

export default function BudgetLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={drawerListHeaderOptions} />
      <Stack.Screen name="new" options={{ title: 'Ny budgetpost' }} />
      <Stack.Screen name="settings" options={{ title: 'Budget-indstillinger' }} />
      <Stack.Screen name="month/[ym]" options={{ title: 'Måned' }} />
      <Stack.Screen name="actuals" options={{ title: 'Faktisk beløb' }} />
      <Stack.Screen name="savings" options={{ title: 'Opsparing' }} />
      <Stack.Screen name="[id]" options={{ title: 'Redigér post' }} />
    </Stack>
  );
}
