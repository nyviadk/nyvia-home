import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { DeleteTimeEntryLink } from '../components/delete-time-entry-link';
import { TimeEntryForm } from '../components/time-entry-form';
import { updateTimeEntry } from '../data/timetracker.repository';
import { useTimeEntry } from '../hooks/use-time-entry';

export function EditTimeEntryScreen({ id }: { id: string }) {
  const { entry, loading } = useTimeEntry(id);

  if (loading || !entry) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

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
      <DeleteTimeEntryLink
        id={id}
        label={`${entry.category} ${entry.startTime}–${entry.endTime ?? '?'}`}
      />
    </Screen>
  );
}
