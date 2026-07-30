import { useLocalSearchParams } from 'expo-router';

import { GiveScreen } from '@/features/wishlist/screens/give-screen';

export default function GiveRoute() {
  const { uid, wishId } = useLocalSearchParams<{ uid: string; wishId: string }>();
  return <GiveScreen ownerUid={uid} wishId={wishId} />;
}
