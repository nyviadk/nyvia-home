import { useLocalSearchParams } from 'expo-router';

import { ReserveScreen } from '@/features/wishlist/screens/reserve-screen';

export default function ReserveRoute() {
  const { uid, wishId, index } = useLocalSearchParams<{
    uid: string;
    wishId: string;
    index?: string;
  }>();
  const parsed = index != null ? Number(index) : NaN;
  return (
    <ReserveScreen
      ownerUid={uid}
      wishId={wishId}
      index={Number.isInteger(parsed) ? parsed : undefined}
    />
  );
}
