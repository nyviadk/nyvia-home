import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';

/** Native-fallback: My Planio er et desktop-review-værktøj og bygges kun til web. */
export function PlanioUnavailableScreen() {
  return (
    <Screen>
      <AppText variant="title">My Planio</AppText>
      <EmptyState
        title="Kun på web"
        description="My Planio er et review-værktøj til desktop. Åbn det på web for at komponere og gemme dine prompts."
      />
    </Screen>
  );
}
