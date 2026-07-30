import { useLocalSearchParams } from 'expo-router';

import { WishFormScreen } from '@/features/wishlist/screens/wish-form-screen';

export default function EditWishRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WishFormScreen id={id} />;
}
