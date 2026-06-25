import { View } from '@/tw';
import { AppText } from './text';

export interface EmptyStateProps {
  title: string;
  description?: string;
}

/** Vises når en liste er tom. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-2 py-12">
      <AppText variant="heading">{title}</AppText>
      {description ? (
        <AppText variant="muted" className="text-center">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
