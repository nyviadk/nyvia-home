import { useLocalSearchParams } from 'expo-router';

import { EditTimeEntryScreen } from '@/features/timetracker/screens/edit-time-entry-screen';

export default function TimeEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditTimeEntryScreen id={id} />;
}
