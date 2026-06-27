import { useLocalSearchParams } from 'expo-router';

import { BudgetMonthScreen } from '@/features/budget/screens/budget-month-screen';

export default function BudgetMonthRoute() {
  const { ym } = useLocalSearchParams<{ ym: string }>();
  return <BudgetMonthScreen ym={ym} />;
}
