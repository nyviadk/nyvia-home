import { useLocalSearchParams } from 'expo-router';

import { EditBudgetEntryScreen } from '@/features/budget/screens/edit-budget-entry-screen';

export default function BudgetEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditBudgetEntryScreen id={id} />;
}
