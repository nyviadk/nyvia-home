import { useLocalSearchParams } from 'expo-router';

import { SavingsEditorScreen } from '@/features/budget/screens/savings-editor-screen';

export default function BudgetSavingsRoute() {
  const { ym } = useLocalSearchParams<{ ym: string }>();
  return <SavingsEditorScreen ym={ym} />;
}
