import { Link } from 'expo-router';

import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import type { ProteinLogEntry } from '../types';

/**
 * Én logget ting. Navnet åbner redigering; +/− ændrer antal portioner uden at forlade
 * skærmen, fordi "jeg tog to" er den hyppigste rettelse og ikke skal koste en navigation.
 */
export function LogRow({
  entry,
  onQty,
  onDelete,
}: {
  entry: WithId<ProteinLogEntry>;
  onQty: (qty: number) => void;
  onDelete: () => void;
}) {
  const protein = Math.round(entry.proteinG * entry.qty * 10) / 10;
  const kcal = Math.round(entry.kcal * entry.qty);

  return (
    <View className="flex-row items-center gap-2 border-b border-border py-2.5">
      <View className="flex-1 gap-0.5">
        <Link href={{ pathname: '/protein/log/[id]', params: { id: entry.id } }} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={`Redigér ${entry.name}`}>
            <AppText variant="label" numberOfLines={2}>
              {entry.qty > 1 ? `${entry.qty}× ` : ''}
              {entry.name}
            </AppText>
          </Pressable>
        </Link>
        <AppText variant="muted" className="text-xs">
          {protein} g · {kcal} kcal
          {entry.estimated ? ' · skøn' : ''}
        </AppText>
      </View>

      <View className="flex-row items-center gap-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Færre ${entry.name}`}
          hitSlop={6}
          onPress={() => (entry.qty > 1 ? onQty(entry.qty - 1) : onDelete())}
          className="h-8 w-8 items-center justify-center rounded-lg bg-element active:opacity-70">
          <AppText className="text-lg leading-none text-fg">−</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Flere ${entry.name}`}
          hitSlop={6}
          onPress={() => onQty(entry.qty + 1)}
          className="h-8 w-8 items-center justify-center rounded-lg bg-element active:opacity-70">
          <AppText className="text-lg leading-none text-fg">+</AppText>
        </Pressable>
      </View>
    </View>
  );
}
