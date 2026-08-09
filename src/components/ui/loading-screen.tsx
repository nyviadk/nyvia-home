import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';

/**
 * Ventetilstanden mens en post hentes fra sin store. Bevidst uden spinner: data ligger
 * som regel allerede i den persisterede cache, så teksten når sjældent at blive set —
 * en spinner ville blinke mere end den beroliger.
 */
export function LoadingScreen() {
  return (
    <Screen>
      <AppText variant="muted">Indlæser…</AppText>
    </Screen>
  );
}
