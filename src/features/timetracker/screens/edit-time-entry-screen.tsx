import { router } from 'expo-router';

import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { TimeEntryForm } from '../components/time-entry-form';
import { useTimetrackerStore } from '../data/timetracker-store';
import { deleteTimeEntry, updateTimeEntry } from '../data/timetracker.repository';
import { useTimeEntry } from '../hooks/use-time-entry';

export function EditTimeEntryScreen({ id }: { id: string }) {
  const { entry, loading } = useTimeEntry(id);

  if (loading || !entry) return <LoadingScreen />;

  return (
    <Screen>
      <AppText variant="title">Redigér registrering</AppText>
      <TimeEntryForm
        entry={entry}
        submitLabel="Gem ændringer"
        onSubmit={async (input) => {
          await updateTimeEntry(id, input);
          router.back();
        }}
      />
      <DeleteEntityLink
        id={id}
        label="Slet registrering"
        name={`${entry.category} ${entry.startTime}–${entry.endTime ?? '?'}`}
        pending={useTimetrackerStore.pending}
        remove={() => deleteTimeEntry(id)}
      />
    </Screen>
  );
}
