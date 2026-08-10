import { useLocalSearchParams } from 'expo-router';

import { EditEntryScreen } from '@/features/spanish/screens/edit-entry-screen';

export default function EditEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditEntryScreen id={id} />;
}
