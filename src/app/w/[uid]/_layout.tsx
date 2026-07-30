import { Stack } from 'expo-router';

/** Delt ønskeliste: egen stak, så "Reservér" bliver en rigtig skærm man kan gå tilbage fra. */
export const unstable_settings = {
  anchor: 'index',
};

export default function PublicWishlistLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
