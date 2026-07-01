import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';

/** Forside (foreløbig tom) — overblik/genveje kommer her senere. */
export default function ForsideScreen() {
  return (
    <Screen>
      <AppText variant="title">NyviaHome</AppText>
      <AppText variant="muted">Din forside. Overblik og genveje samles her.</AppText>
    </Screen>
  );
}
