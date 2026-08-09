import { Image } from 'expo-image';
import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { DeleteRowButton } from '@/components/ui/delete-row-button';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { useInspectionStore } from '../data/inspection-store';
import { deleteInspectionItem } from '../data/inspection.repository';
import type { InspectionItem } from '../types';

export function InspectionItemCard({ item }: { item: WithId<InspectionItem> }) {
  return (
    <Card className="gap-2">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          {item.room ? <AppText variant="muted">{item.room}</AppText> : null}
          <AppText variant="label">{item.title}</AppText>
          {item.notes ? <AppText variant="muted">{item.notes}</AppText> : null}
        </View>
        <View className="flex-row items-center gap-4">
          <Link
            href={{
              pathname: '/homes/[id]/inspection/[itemId]',
              params: { id: item.homeId, itemId: item.id },
            }}
            asChild>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <AppText className="text-sm text-primary">Rediger</AppText>
            </Pressable>
          </Link>
          <DeleteRowButton
            id={item.id}
            title="Slet syns-post"
            name={item.title}
            pending={useInspectionStore.pending}
            remove={() => deleteInspectionItem(item)}
          />
        </View>
      </View>

      {item.photos.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {item.photos.map((p) => (
            <View key={p.path} className="gap-0.5" style={{ width: 84 }}>
              <Image
                source={{ uri: p.url }}
                style={{ width: 84, height: 84, borderRadius: 8 }}
                contentFit="cover"
              />
              {p.takenAt ? (
                <AppText variant="muted" className="text-xs">
                  {formatDateCopenhagen(p.takenAt)}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
