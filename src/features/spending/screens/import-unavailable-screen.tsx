import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';

/** Import er web-only (browser-fillæsning). På mobil er forbrug read-only. */
export function ImportUnavailableScreen() {
  return (
    <Screen>
      <AppText variant="title">Importér bankdata</AppText>
      <EmptyState
        title="Kun på web"
        description="CSV-import foregår på web. På mobilen kan du se det importerede forbrug pr. konto."
      />
    </Screen>
  );
}
