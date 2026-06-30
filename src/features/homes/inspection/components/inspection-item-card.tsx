import { Image } from 'expo-image';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
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
        <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
          <AppText className="text-sm text-danger">Slet</AppText>
        </Pressable>
      </View>

      {item.photos.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {item.photos.map((p) => (
            <Image
              key={p.path}
              source={{ uri: p.url }}
              style={{ width: 84, height: 84, borderRadius: 8 }}
              contentFit="cover"
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}
