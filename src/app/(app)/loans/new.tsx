import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

export default function NewLoanChooser() {
  return (
    <Screen>
      <AppText variant="title">Vælg type</AppText>
      <View className="gap-3">
        <Link href="/loans/standard" asChild>
          <Button title="Standard lån" />
        </Link>
        <Link href="/loans/custom" asChild>
          <Button title="Custom flytte-lån" variant="secondary" />
        </Link>
      </View>
      <AppText variant="muted">
        Standard: fast ydelse og restgæld. Custom: poster, udgifter før/efter og afbetalingsplan.
      </AppText>
    </Screen>
  );
}
