import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/** Delt ønskeliste: egen stak, så "Reservér" bliver en rigtig skærm man kan gå tilbage fra. */
export const unstable_settings = {
  anchor: 'index',
};

/**
 * Den delte liste er den ENESTE side gæster ser, og de kan ikke logge ind, genindlæse i en anden
 * fane eller på anden måde hjælpe sig selv. Uden dette blev en fejl midt i render til en helt hvid
 * side uden så meget som en knap. Nu kan de prøve igen.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <Screen>
      <View className="gap-4 py-10">
        <AppText className="text-3xl font-bold leading-tight text-fg">Noget gik galt</AppText>
        <AppText className="text-xl leading-relaxed text-fg">
          Ønskelisten kunne ikke vises. Prøv igen — virker det stadig ikke, så åbn linket forfra.
        </AppText>
        <AppText variant="muted" className="text-base">
          {error.message}
        </AppText>
        <Button title="Prøv igen" onPress={() => void retry()} className="mt-2" />
      </View>
    </Screen>
  );
}

export default function PublicWishlistLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
