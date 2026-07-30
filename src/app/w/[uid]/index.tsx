import { useLocalSearchParams } from 'expo-router';

import { PublicWishlistScreen } from '@/features/wishlist/screens/public-wishlist-screen';

/** Offentligt delelink til en ønskeliste — ligger UDEN FOR auth-gaten, så gæster slipper for login. */
export default function PublicWishlistRoute() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  return <PublicWishlistScreen ownerUid={uid} />;
}
