import { useLocalSearchParams } from 'expo-router';

import { GiftScreen } from '@/features/wishlist/screens/gift-screen';

export default function GiftRoute() {
  const { uid, wishId } = useLocalSearchParams<{ uid: string; wishId: string }>();
  return <GiftScreen ownerUid={uid} wishId={wishId} />;
}
