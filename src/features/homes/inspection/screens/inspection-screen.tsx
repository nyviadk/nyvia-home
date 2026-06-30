import { Link, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { useHomesStore } from '../../data/homes-store';
import { InspectionItemCard } from '../components/inspection-item-card';
import { useInspectionStore } from '../data/inspection-store';

export function InspectionScreen() {
  const { id: homeId } = useLocalSearchParams<{ id: string }>();
  const home = useHomesStore((s) => s.items.find((h) => h.id === homeId));
  const items = useInspectionStore((s) => s.items).filter((i) => i.homeId === homeId);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <AppText variant="title">Indflytningssyn</AppText>
          {home ? <AppText variant="muted">{home.address}</AppText> : null}
        </View>
        <Link href={{ pathname: '/homes/[id]/inspection/new', params: { id: homeId ?? '' } }} asChild>
          <Button title="Tilføj" className="h-10 px-4" />
        </Link>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Ingen poster endnu"
          description="Tilføj fejl/mangler med billeder (vælg fra kamerarullen) pr. rum, så du har dokumentation til udlejer."
        />
      ) : (
        <View className="gap-2">
          {items.map((item) => (
            <InspectionItemCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </Screen>
  );
}
