import { router } from 'expo-router';

import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { EntryForm } from '../components/entry-form';
import { useSpanishStore } from '../data/spanish-store';
import { deleteSpanishEntryWithImages, updateSpanishEntry } from '../data/spanish.repository';

export function EditEntryScreen({ id }: { id: string }) {
  const { item: entry, loading } = useSpanishStore.useItem(id);

  if (loading || !entry) return <LoadingScreen />;

  return (
    <Screen>
      <AppText variant="title">Redigér post</AppText>
      {/* key: formularen seeder sin billed-state fra posten ved mount. */}
      <EntryForm
        key={entry.id}
        entry={entry}
        submitLabel="Gem ændringer"
        onSubmit={async (input, images, onProgress) => {
          await updateSpanishEntry(entry, input, images, onProgress);
          router.back();
        }}
      />
      <DeleteEntityLink
        id={id}
        label="Slet post"
        name={entry.da}
        pending={useSpanishStore.pending}
        remove={() => deleteSpanishEntryWithImages(entry)}
      />
    </Screen>
  );
}
