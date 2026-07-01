import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';

/** Forside (foreløbig tom) — overblik/genveje samles her. På web nås den også via logoet. */
export default function ForsideScreen() {
  return (
    <Screen>
      <AppText variant="title">NyviaHome</AppText>
      <AppText variant="muted">Din forside. Overblik og genveje samles her.</AppText>
    </Screen>
  );
}
