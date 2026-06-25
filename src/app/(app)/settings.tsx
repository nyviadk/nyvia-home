import { AppText, Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/auth-context';
import { View } from '@/tw';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  return (
    <Screen>
      <AppText variant="title">Indstillinger</AppText>
      <Card className="gap-1">
        <AppText variant="muted">Logget ind som</AppText>
        <AppText variant="label">{user?.email ?? '—'}</AppText>
      </Card>
      <View className="mt-2">
        <Button title="Log ud" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}
