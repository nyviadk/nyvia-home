import { Modal } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/**
 * Overlay med fremdrift for batch-skrivning/sletning — viser stadie + antal, så man
 * ser at noget sker (ikke en frossen spinner). Valgfri annuller-knap.
 */
export function BulkProgress({
  visible,
  label,
  done,
  total,
  onCancel,
}: {
  visible: boolean;
  label: string;
  done: number;
  total: number;
  onCancel?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 p-6">
        <Card className="w-full gap-3" style={{ maxWidth: 360 }}>
          <AppText variant="label">{label}</AppText>
          <ProgressBar value={total > 0 ? done / total : 0} />
          <AppText variant="muted">
            {done} / {total}
          </AppText>
          {onCancel ? <Button title="Annullér" variant="secondary" onPress={onCancel} /> : null}
        </Card>
      </View>
    </Modal>
  );
}
