import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { EntryForm } from '../components/entry-form';
import { createSpanishEntry } from '../data/spanish.repository';

export function CreateEntryScreen() {
  return (
    <Screen>
      <AppText variant="title">Ny post</AppText>
      <EntryForm
        submitLabel="Tilføj"
        onSubmit={async (input, images, onProgress) => {
          await createSpanishEntry(input, images, onProgress);
          router.back();
        }}
      />
    </Screen>
  );
}
