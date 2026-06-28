import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/** Fremdrift for batch-skrivning/sletning, så man ser at noget sker (ikke en frossen spinner). */
export function BulkProgress({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between">
        <AppText variant="label">{label}</AppText>
        <AppText variant="muted">
          {done} / {total}
        </AppText>
      </View>
      <ProgressBar value={total > 0 ? done / total : 0} />
    </Card>
  );
}
