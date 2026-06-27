import { useLocalSearchParams } from 'expo-router';

import { ActualsEditorScreen } from '@/features/budget/screens/actuals-editor-screen';

export default function BudgetActualsRoute() {
  const { id, ym } = useLocalSearchParams<{ id: string; ym: string }>();
  return <ActualsEditorScreen id={id} ym={ym} />;
}
