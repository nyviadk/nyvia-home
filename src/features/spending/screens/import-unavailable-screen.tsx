import { WebOnlyScreen } from '@/components/ui/web-only-screen';

/** Import er web-only (browser-fillæsning). På mobil er forbrug read-only. */
export function ImportUnavailableScreen() {
  return (
    <WebOnlyScreen
      title="Importér bankdata"
      description="CSV-import foregår på web. På mobilen kan du se det importerede forbrug pr. konto."
    />
  );
}
