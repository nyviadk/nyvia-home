import { AppText, Screen } from '@/components/ui';

export default function TodayScreen() {
  return (
    <Screen>
      <AppText variant="title">I Dag</AppText>
      <AppText variant="muted">Dit overblik samles her, efterhånden som flere features kommer til.</AppText>
    </Screen>
  );
}
