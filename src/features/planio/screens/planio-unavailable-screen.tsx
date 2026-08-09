import { WebOnlyScreen } from '@/components/ui/web-only-screen';

/** Native-fallback: My Planio er et desktop-review-værktøj og bygges kun til web. */
export function PlanioUnavailableScreen() {
  return (
    <WebOnlyScreen
      title="My Planio"
      description="My Planio er et review-værktøj til desktop. Åbn det på web for at komponere og gemme dine prompts."
    />
  );
}
