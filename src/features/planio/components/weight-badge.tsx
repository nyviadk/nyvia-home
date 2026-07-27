import { View } from '@/tw';
import { AppText } from '@/components/ui/text';
import type { PlanioWeight } from '../types';

/** kritisk → rød · tilbagevendende → gul · enkelt → dæmpet. Statiske klasser (Tailwind ser dem). */
const TONE: Record<PlanioWeight, { box: string; text: string }> = {
  kritisk: { box: 'bg-danger/15', text: 'text-danger' },
  tilbagevendende: { box: 'bg-warning/15', text: 'text-warning' },
  enkelt: { box: 'bg-element', text: 'text-fg-muted' },
};

export function WeightBadge({ weight }: { weight: PlanioWeight }) {
  const tone = TONE[weight];
  return (
    <View className={`self-start rounded px-1.5 py-0.5 ${tone.box}`}>
      <AppText className={`text-[10px] ${tone.text}`}>{weight}</AppText>
    </View>
  );
}
