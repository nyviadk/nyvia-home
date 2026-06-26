import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { signOut, useAuthStore } from '@/lib/auth/auth-store';
import { View } from '@/tw';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
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
