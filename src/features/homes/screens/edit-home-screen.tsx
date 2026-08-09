import { router, useLocalSearchParams } from 'expo-router';

import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { HomeForm } from '../components/home-form';
import { useHomesStore } from '../data/homes-store';
import { deleteHome, updateHome } from '../data/homes.repository';

export function EditHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const home = useHomesStore.useItem(id).item;

  if (!home) {
    return (
      <Screen>
        <EmptyState title="Bolig ikke fundet" description="Den er måske slettet." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Redigér bolig</AppText>
      <HomeForm
        home={home}
        submitLabel="Gem"
        onSubmit={async (input) => {
          await updateHome(home.id, input);
          router.back();
        }}
      />
      <DeleteEntityLink
        id={home.id}
        label="Slet bolig"
        name={home.address}
        confirmMessage={`Vil du slette "${home.address}"? Flytte-data på boligen forbliver, men knyttes ikke længere til en synlig bolig.`}
        pending={useHomesStore.pending}
        remove={() => deleteHome(home.id)}
      />
    </Screen>
  );
}
