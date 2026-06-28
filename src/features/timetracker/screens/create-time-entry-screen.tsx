import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { TimeEntryForm } from '../components/time-entry-form';
import { createTimeEntry } from '../data/timetracker.repository';

export function CreateTimeEntryScreen() {
  return (
    <Screen>
      <AppText variant="title">Ny registrering</AppText>
      <TimeEntryForm
        submitLabel="Gem"
        onSubmit={async (input) => {
          await createTimeEntry(input);
          router.back();
        }}
      />
    </Screen>
  );
}
