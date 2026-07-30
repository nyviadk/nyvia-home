import { useLocalSearchParams } from 'expo-router';

import { ExtraScreen } from '@/features/wishlist/screens/extra-screen';

export default function ExtraRoute() {
  const { uid, id } = useLocalSearchParams<{ uid: string; id?: string }>();
  return <ExtraScreen ownerUid={uid} extraId={id} />;
}
