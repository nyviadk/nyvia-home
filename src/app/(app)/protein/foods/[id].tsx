import { useLocalSearchParams } from 'expo-router';

import { EditFoodScreen } from '@/features/protein/screens/food-form-screens';

export default function EditFoodRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditFoodScreen id={id} />;
}
