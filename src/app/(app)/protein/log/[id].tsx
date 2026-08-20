import { useLocalSearchParams } from 'expo-router';

import { LogEntryScreen } from '@/features/protein/screens/log-entry-screen';

export default function LogEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogEntryScreen id={id} />;
}
