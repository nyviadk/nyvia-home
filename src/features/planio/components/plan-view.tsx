import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { buildPlan } from '../prompts';
import type { PlanioLesson } from '../types';
import { PromptCard } from './prompt-card';

/** Plan-tjek: kør prompten i den Claude, der allerede har planen i chatten. */
export function PlanView({ lessons }: { lessons: WithId<PlanioLesson>[] }) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="heading">Planlægning</AppText>
        <AppText variant="muted">
          Claude har allerede planen i chatten — kopiér prompten derind, så den tjekker planen mod dine
          blinde vinkler, før du bygger.
        </AppText>
      </View>
      <PromptCard
        title="Plan-tjek"
        sub="Samlet af dine lektioner (kritisk + tilbagevendende)"
        prompt={buildPlan(lessons)}
      />
    </View>
  );
}
