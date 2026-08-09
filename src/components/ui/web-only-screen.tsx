import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';

/** Native-fallback for de features der kun bygges til web (CSV-import, My Planio). */
export function WebOnlyScreen({ title, description }: { title: string; description: string }) {
  return (
    <Screen>
      <AppText variant="title">{title}</AppText>
      <EmptyState title="Kun på web" description={description} />
    </Screen>
  );
}
