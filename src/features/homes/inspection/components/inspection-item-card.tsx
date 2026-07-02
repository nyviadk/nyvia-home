import { Image } from 'expo-image';
import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import { confirmAction } from '@/lib/confirm';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { deleteInspectionItem } from '../data/inspection.repository';
import type { InspectionItem } from '../types';

export function InspectionItemCard({ item }: { item: WithId<InspectionItem> }) {
  async function onDelete() {
    const ok = await confirmAction('Slet syns-post', `Slet "${item.title}"?`, 'Slet');
    if (ok) await deleteInspectionItem(item);
  }

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
          <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
            <AppText className="text-sm text-danger">Slet</AppText>
          </Pressable>
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
